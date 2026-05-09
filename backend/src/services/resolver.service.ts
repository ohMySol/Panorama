import type { ContractTier } from '@risk-terminal/shared';
import { AbiItem, fetchFromSourcify } from '../clients/sourcify.client';
import { fetchFromEtherscan } from '../clients/etherscan.client';
import { fetchBytecode } from '../clients/rpc.client';
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
 * @param abi - Parsed ABI when source is available; null otherwise.
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
    const key = cacheKey(chainId, address);
    const cached = cache.get(key);
    if (cached) return cached;

    // Tier 1: Sourcify
    const sourcify = await safeCall(() => fetchFromSourcify(address, chainId));
    if (sourcify) {
        const resolved: ResolvedContract = {
            address: sourcify.address,
            name: sourcify.name,
            tier: 1,
            abi: sourcify.abi,
            sourceAvailable: true,
            hasBytecode: true,
        };
        cache.set(key, resolved);
        return resolved;
    }

    // Tier 2: Etherscan
    const etherscan = await safeCall(() => fetchFromEtherscan(address, chainId));
    if (etherscan) {
        const resolved: ResolvedContract = {
            address: etherscan.address,
            name: etherscan.name,
            tier: 2,
            abi: etherscan.abi,
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
