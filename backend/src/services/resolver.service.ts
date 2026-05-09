import type { ContractTier } from '@risk-terminal/shared';
import type { Abi } from 'viem';
import { AbiItem, fetchFromSourcify } from '../clients/sourcify.client';
import { fetchFromEtherscan } from '../clients/etherscan.client';
import { fetchBytecode, readContract, readStorageAt } from '../clients/rpc.client';
import { RESOLVER_CACHE_TTL_MS } from '../config/config';
import { TtlCache } from './cache.service';

/**
 * Result of resolving a single contract address.
 *
 * @param address - The address that was resolved.
 * @param name - Best-effort contract name; null if no source available.
 * @param tier - Trust tier (1 = Sourcify, 2 = Etherscan, 3 = Bytecode match,
 *               4 = Factory-typed, 5 = Unknown). Currently the resolver assigns 1, 2, or 5;
 *               tiers 3 and 4 are reserved for future bytecode/factory matching.
 * @param abi - Parsed ABI when source is available; null otherwise. For proxies, the
 *              implementation's ABI is merged in so manifest fingerprinting can identify
 *              the underlying protocol (e.g. USDC's FiatTokenProxy → ERC-20).
 * @param sourceAvailable - Convenience flag: true when `abi` is non-null.
 * @param hasBytecode - True when the address has deployed code (i.e. is a contract, not an EOA).
 */
export interface ResolvedContract {
    address: string;
    name: string | null;
    tier: ContractTier;
    abi: AbiItem[] | null;
    sourceAvailable: boolean;
    hasBytecode: boolean;
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

/**
 * Standard 0-arg view getters that, when present, indicate the contract delegates
 * to an implementation. Covers EIP-897 / OpenZeppelin proxies (`implementation`)
 * and Safe / Gnosis-style proxies (`masterCopy`).
 */
const PROXY_GETTERS = ['implementation', 'masterCopy'];

/** Bound on transitive proxy chains. Two hops covers proxy-of-proxy patterns; deeper is suspicious. */
const MAX_PROXY_DEPTH = 2;

/**
 * Composite cache key — the same address can resolve to different metadata across chains.
 */
type CacheKey = `${number}:${string}`;

const cache = new TtlCache<CacheKey, ResolvedContract>(RESOLVER_CACHE_TTL_MS);

const cacheKey = (chainId: number, address: string): CacheKey =>
    `${chainId}:${address.toLowerCase()}`;

/**
 * Resolves a contract by walking the verification ladder:
 *   Sourcify (Tier 1) → Etherscan (Tier 2) → Bytecode probe (Tier 5 if no source).
 *
 * For proxies, the implementation's ABI is merged in so manifest fingerprinting
 * sees the underlying protocol's functions (transfer/balanceOf for tokens,
 * getOwners/getThreshold for Safes, etc.).
 *
 * Each call is cached for `RESOLVER_CACHE_TTL_MS` so that repeated lookups within
 * the same graph build (or across graphs) hit memory instead of external APIs.
 *
 * @param address - 0x-prefixed contract address.
 * @param chainId - Numeric chain ID.
 * @returns A `ResolvedContract` — never throws for "not verified" cases; only on transport errors.
 */
export async function resolveContract(
    address: string,
    chainId: number,
): Promise<ResolvedContract> {
    return resolveAt(address, chainId, 0);
}

async function resolveAt(
    address: string,
    chainId: number,
    proxyDepth: number,
): Promise<ResolvedContract> {
    const key = cacheKey(chainId, address);
    const cached = cache.get(key);
    if (cached) return cached;

    // Tier 1: Sourcify
    const sourcify = await safeCall(() => fetchFromSourcify(address, chainId));
    if (sourcify) {
        const abi = await expandProxyAbi(sourcify.address, sourcify.name, sourcify.abi, chainId, proxyDepth);
        const resolved: ResolvedContract = {
            address: sourcify.address,
            name: sourcify.name,
            tier: 1,
            abi,
            sourceAvailable: true,
            hasBytecode: true,
        };
        cache.set(key, resolved);
        return resolved;
    }

    // Tier 2: Etherscan
    const etherscan = await safeCall(() => fetchFromEtherscan(address, chainId));
    if (etherscan) {
        const abi = await expandProxyAbi(etherscan.address, etherscan.name, etherscan.abi, chainId, proxyDepth);
        const resolved: ResolvedContract = {
            address: etherscan.address,
            name: etherscan.name,
            tier: 2,
            abi,
            sourceAvailable: true,
            hasBytecode: true,
        };
        cache.set(key, resolved);
        return resolved;
    }

    // Tier 5: Unknown — but check whether there's bytecode at all.
    // If there isn't, the address is an EOA, which the consumer may want to skip.
    const bytecode = await safeCall(() => fetchBytecode(address, chainId));
    const resolved: ResolvedContract = {
        address,
        name: null,
        tier: 5,
        abi: null,
        sourceAvailable: false,
        hasBytecode: bytecode !== null && bytecode !== '0x',
    };
    cache.set(key, resolved);
    return resolved;
}

/**
 * Well-known proxy implementation storage slots, tried in order. Each is the
 * hash of the spec string the proxy family was published under, so collisions
 * with arbitrary state variables are statistically impossible.
 *
 * - EIP-1967: `keccak256("eip1967.proxy.implementation") - 1`. Modern OZ
 *   transparent / UUPS / ERC1967 proxies.
 * - ZeppelinOS (legacy OZ AdminUpgradeabilityProxy):
 *   `keccak256("org.zeppelinos.proxy.implementation")`. Used by proxies
 *   deployed before EIP-1967 standardised the slot — notably USDC's
 *   FiatTokenProxy and several other legacy stablecoin proxies.
 */
const PROXY_IMPL_SLOTS: readonly `0x${string}`[] = [
    '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
    '0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3',
];
/** Storage slot 0 — Safe / Gnosis-style proxies hold the singleton address here. */
const SLOT_ZERO = '0x0000000000000000000000000000000000000000000000000000000000000000';

/** Heuristic name match for Safe-pattern proxies. Reading slot 0 unconditionally
 * would false-positive on any contract whose first state variable happens to be
 * an address; restricting to the recognised name set keeps the read targeted. */
const SAFE_PROXY_NAME_RE = /(safeproxy|gnosissafe)/i;

/**
 * Detects whether `address` is a proxy and returns its implementation. Tries,
 * in order:
 *   1. EIP-1967 implementation storage slot — covers transparent / UUPS / OZ
 *      proxies. USDC's FiatTokenProxy lives here; calling `implementation()`
 *      directly would revert (admin-gated), so the storage read is mandatory.
 *   2. Slot 0 — only when the contract name suggests a Safe-style proxy. The
 *      Safe singleton is stored at slot 0 and there is no on-chain getter on
 *      the proxy itself, so storage is the only reliable path.
 *   3. ABI fallback — call `implementation()` / `masterCopy()` if either is
 *      explicitly declared. Wrapped in `safeCall` so a revert (transparent
 *      proxy non-admin call) drops cleanly to "not detected".
 */
async function detectImplementation(
    address: string,
    name: string | null,
    abi: AbiItem[],
    chainId: number,
): Promise<string | null> {
    for (const slot of PROXY_IMPL_SLOTS) {
        const impl = await readSlotAsAddress(address, slot, chainId);
        if (impl) return impl;
    }

    if (name && SAFE_PROXY_NAME_RE.test(name)) {
        const slot0 = await readSlotAsAddress(address, SLOT_ZERO, chainId);
        if (slot0) return slot0;
    }

    const getter = abi.find(
        (item) =>
            item.type === 'function' &&
            typeof item.name === 'string' &&
            PROXY_GETTERS.includes(item.name) &&
            (item.inputs?.length ?? 0) === 0 &&
            item.outputs?.length === 1,
    );
    if (getter?.name) {
        const v = await safeCall(() =>
            readContract<string>(address, [getter] as Abi, getter.name as string, [], chainId),
        );
        if (typeof v === 'string' && ADDRESS_RE.test(v) && v.toLowerCase() !== ZERO_ADDRESS) {
            return v;
        }
    }

    return null;
}

/**
 * Reads a 32-byte storage slot and extracts an address from its low 20 bytes.
 * Returns null for empty / zero / malformed slots.
 */
async function readSlotAsAddress(
    address: string,
    slot: `0x${string}`,
    chainId: number,
): Promise<string | null> {
    const raw = await readStorageAt(address, slot, chainId);
    if (!raw || raw.length < 42) return null;
    const candidate = '0x' + raw.slice(-40);
    if (!ADDRESS_RE.test(candidate) || candidate.toLowerCase() === ZERO_ADDRESS) return null;
    return candidate;
}

/**
 * If `address` is a proxy, resolves the implementation and merges its ABI into
 * the proxy's. Returns the proxy's ABI unchanged when no proxy is detected.
 *
 * Merge (rather than replace) keeps the proxy's admin functions (`upgradeTo`,
 * `admin`, …) visible to risk profiles while exposing the implementation's
 * protocol surface to manifest fingerprinting.
 */
async function expandProxyAbi(
    address: string,
    name: string | null,
    abi: AbiItem[],
    chainId: number,
    depth: number,
): Promise<AbiItem[]> {
    if (depth >= MAX_PROXY_DEPTH) return abi;

    const impl = await detectImplementation(address, name, abi, chainId);
    if (!impl) return abi;

    const implResolved = await safeCall(() => resolveAt(impl, chainId, depth + 1));
    if (!implResolved?.abi) return abi;

    return mergeAbis(abi, implResolved.abi);
}

/**
 * Merges two ABI lists, keeping the first occurrence of each `(type, name)` pair.
 * The proxy's items come first, so its admin functions stay visible alongside the
 * implementation's protocol surface.
 */
function mergeAbis(a: AbiItem[], b: AbiItem[]): AbiItem[] {
    const seen = new Set<string>();
    const out: AbiItem[] = [];
    for (const item of [...a, ...b]) {
        const key = `${item.type}:${item.name ?? ''}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(item);
    }
    return out;
}

/**
 * Wraps an async client call so that transient external API failures degrade gracefully:
 * we treat a failure of one tier as "not found" and fall through to the next tier.
 *
 * Logged so operators can observe upstream issues without surfacing them as 500s.
 */
async function safeCall<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
        return await fn();
    } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown error';
        console.warn(`[resolver] external call failed: ${message}`);
        return null;
    }
}
