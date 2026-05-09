import type { Abi } from 'viem';
import { multicall } from '../../clients/rpc.client';
import type { AbiItem } from '../../clients/sourcify.client';
import type {
    AdapterDependency,
    DirectCall,
    FollowUp,
    PaginatedCall,
    ProtocolManifest,
} from './types';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

type Multicall = Parameters<typeof multicall>[0];
type MulticallResult = Awaited<ReturnType<typeof multicall>>[number];

/**
 * Generic, manifest-driven dependency discovery. Replaces per-protocol adapters
 * with a single executor that interprets a `ProtocolManifest`.
 *
 * Workflow:
 *   1. Every direct getter and paginated length getter on the contract,
 *   batched into a single multicall.
 *   2. Every paginated item getter (one per index, per source), batched.
 *   3. Every cross-contract `followUp` lookup keyed by unique item ID, batched.
 *
 * Security boundary: every function name in the manifest is validated against
 * the resolved ABI before any call is issued. A function the resolver does not
 * report is silently dropped, so a stale manifest cannot trigger calls into
 * functions the contract does not expose.
 * 
 * @param manifest - Ordered registry with per protocol instructions.  
 * @param address - Address of the contract
 * @param abi - Resolved ABI of the contract
 * @param cahinId - Chain id
 */
export async function executeManifest(
    manifest: ProtocolManifest,
    address: string,
    abi: AbiItem[],
    chainId: number,
): Promise<AdapterDependency[]> {
    const abiByName = new Map<string, AbiItem>();
    for (const item of abi) {
        if (item.type === 'function' && item.name && !abiByName.has(item.name)) {
            abiByName.set(item.name, item);
        }
    }

    const directs = (manifest.directCalls ?? [])
        .map((dc) => ({ dc, sig: abiByName.get(dc.function) }))
        .filter((x): x is { dc: DirectCall; sig: AbiItem } => Boolean(x.sig));

    const paginated = (manifest.paginatedCalls ?? []).map((pc) => ({
        pc,
        sources: pc.sources
            .map((s) => ({
                lenSig: abiByName.get(s.lengthFunction),
                itemSig: abiByName.get(s.itemFunction),
            }))
            .filter(
                (s): s is { lenSig: AbiItem; itemSig: AbiItem } =>
                    Boolean(s.lenSig && s.itemSig),
            ),
    }));

    // Round 1 — direct getters + every paginated source's length getter.
    const round1: Multicall = [
        ...directs.map(({ sig }) => mkCall(address, sig)),
        ...paginated.flatMap(({ sources }) => sources.map((s) => mkCall(address, s.lenSig))),
    ];
    const r1 = round1.length ? await multicall(round1, chainId) : [];

    const dependencies: AdapterDependency[] = [];
    const roleToAddress = new Map<string, string>();

    let cursor = 0;
    for (const { dc } of directs) {
        const v = unwrap(r1[cursor++]);
        if (isAddress(v)) {
            roleToAddress.set(dc.role, v);
            dependencies.push({ to: v, type: dc.role });
        }
    }

    // Round 2 — paginated item getters, sized by the lengths we just read.
    const round2Plan = paginated.map(({ pc, sources }) => {
        const calls: Multicall = sources.flatMap((s) => {
            const len = unwrap(r1[cursor++]);
            const count = typeof len === 'bigint' ? Math.min(Number(len), pc.maxItemsPerSource) : 0;
            return Array.from({ length: count }, (_, i) =>
                mkCall(address, s.itemSig, [BigInt(i)]),
            );
        });
        return { pc, calls };
    });

    const round2 = round2Plan.flatMap((p) => p.calls);
    const r2 = round2.length ? await multicall(round2, chainId) : [];

    // Bucket Round-2 results back into their owning paginated config.
    let r2Cursor = 0;
    const followUpJobs: { fu: FollowUp; target: string; ids: string[] }[] = [];
    for (const { pc, calls } of round2Plan) {
        const slice = r2.slice(r2Cursor, r2Cursor + calls.length);
        r2Cursor += calls.length;

        if (pc.itemType === 'address') {
            if (!pc.role) continue;
            for (const r of slice) {
                const v = unwrap(r);
                if (isAddress(v)) dependencies.push({ to: v, type: pc.role });
            }
            continue;
        }

        if (!pc.followUp) continue;
        const target = roleToAddress.get(pc.followUp.addressFromRole);
        if (!target) continue;

        const ids = new Set<string>();
        for (const r of slice) {
            const v = unwrap(r);
            if (typeof v === 'string') ids.add(v);
        }
        if (ids.size) followUpJobs.push({ fu: pc.followUp, target, ids: [...ids] });
    }

    // Round 3 — cross-contract unpacking for every unique bytes32 ID.
    const round3: Multicall = followUpJobs.flatMap(({ fu, target, ids }) =>
        ids.map((id) => mkCall(target, fu.function as AbiItem, [id])),
    );
    const r3 = round3.length ? await multicall(round3, chainId) : [];

    let r3Cursor = 0;
    for (const { fu, target, ids } of followUpJobs) {
        const slice = r3.slice(r3Cursor, r3Cursor + ids.length);
        r3Cursor += ids.length;

        for (const r of slice) {
            if (r.status !== 'success' || !Array.isArray(r.result)) continue;
            const tuple = r.result as readonly unknown[];
            for (const ex of fu.extract) {
                const v = tuple[ex.index];
                if (!isAddress(v)) continue;
                dependencies.push({
                    to: v,
                    type: ex.role,
                    ...(fu.anchorFromTarget ? { from: target } : {}),
                });
            }
        }
    }

    return dedupe(dependencies);
}

function mkCall(address: string, sig: AbiItem, args: readonly unknown[] = []): Multicall[number] {
    return { address, abi: [sig] as Abi, functionName: sig.name as string, args };
}

function unwrap(r: MulticallResult | undefined): unknown {
    return r && r.status === 'success' ? r.result : null;
}

function isAddress(v: unknown): v is string {
    return typeof v === 'string' && ADDRESS_RE.test(v) && v.toLowerCase() !== ZERO_ADDRESS;
}

function dedupe(deps: AdapterDependency[]): AdapterDependency[] {
    const seen = new Set<string>();
    const out: AdapterDependency[] = [];
    for (const d of deps) {
        const key = `${d.from ?? ''}:${d.to.toLowerCase()}:${d.type}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(d);
    }
    return out;
}
