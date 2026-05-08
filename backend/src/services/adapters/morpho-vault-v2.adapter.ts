import type { Abi } from 'viem';
import { multicall } from '../../clients/rpc.client';
import type { Adapter, AdapterDependency } from './types';

const MAX_ADAPTERS_PER_VAULT = 5;

const VAULT_V2_ABI = [
    { type: 'function', name: 'asset', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
    { type: 'function', name: 'adapterRegistry', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
    { type: 'function', name: 'liquidityAdapter', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
    { type: 'function', name: 'curator', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
    { type: 'function', name: 'owner', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
    { type: 'function', name: 'adaptersLength', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
    { type: 'function', name: 'adapters', inputs: [{ type: 'uint256' }], outputs: [{ type: 'address' }], stateMutability: 'view' },
] as const satisfies Abi;

export const morphoVaultV2Adapter: Adapter = async (address, _abi, chainId) => {
    const baseCalls = [
        { address, abi: VAULT_V2_ABI, functionName: 'asset' },
        { address, abi: VAULT_V2_ABI, functionName: 'adapterRegistry' },
        { address, abi: VAULT_V2_ABI, functionName: 'liquidityAdapter' },
        { address, abi: VAULT_V2_ABI, functionName: 'curator' },
        { address, abi: VAULT_V2_ABI, functionName: 'owner' },
        { address, abi: VAULT_V2_ABI, functionName: 'adaptersLength' },
    ];
    const baseResults = await multicall(baseCalls, chainId);
    const [asset, adapterRegistry, liquidityAdapter, curator, owner, adaptersLength] =
        baseResults.map(unwrapResult);

    const dependencies: AdapterDependency[] = [];
    pushIfAddress(dependencies, asset, 'loanToken');
    pushIfAddress(dependencies, adapterRegistry, 'adapterRegistry');
    pushIfAddress(dependencies, liquidityAdapter, 'liquidityAdapter');
    pushIfAddress(dependencies, curator, 'curator');
    pushIfAddress(dependencies, owner, 'owner');

    const adapterCount = typeof adaptersLength === 'bigint'
        ? Math.min(Number(adaptersLength), MAX_ADAPTERS_PER_VAULT)
        : 0;

    if (adapterCount === 0) return dedupeByAddress(dependencies);

    const adapterCalls = Array.from({ length: adapterCount }, (_, i) => ({
        address,
        abi: VAULT_V2_ABI,
        functionName: 'adapters',
        args: [BigInt(i)] as const,
    }));
    const adapterResults = await multicall(adapterCalls, chainId);
    for (const r of adapterResults) {
        if (r.status === 'success') pushIfAddress(dependencies, r.result, 'protocolAdapter');
    }

    return dedupeByAddress(dependencies);
};

/* ==================== helpers ==================== */

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

function unwrapResult(
    r: { status: 'success'; result: unknown } | { status: 'failure'; error: Error },
): unknown {
    return r.status === 'success' ? r.result : null;
}

function pushIfAddress(out: AdapterDependency[], value: unknown, type: string): void {
    if (typeof value !== 'string') return;
    if (!/^0x[0-9a-fA-F]{40}$/.test(value)) return;
    if (value.toLowerCase() === ZERO_ADDRESS) return;
    out.push({ to: value, type });
}

function dedupeByAddress(deps: AdapterDependency[]): AdapterDependency[] {
    const seen = new Set<string>();
    const out: AdapterDependency[] = [];
    for (const dep of deps) {
        const key = dep.to.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(dep);
    }
    return out;
}
