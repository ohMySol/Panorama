import { createPublicClient, getAddress, http, type Abi, type Address, type PublicClient } from 'viem';
import { mainnet } from 'viem/chains';
import { ETHEREUM_RPC_URL, HTTP_TIMEOUT_MS } from '../config/config';

/**
 * Normalises an address into the form viem expects (EIP-55 checksum).
 * viem 2.x rejects mixed-case addresses that don't satisfy the checksum, so we
 * always pass user input and external API output through this guard.
 *
 * @param addr - The input address.
 * @throws Error if the input is not a syntactically valid 20-byte hex address.
 */
function toAddress(addr: string): Address {
    return getAddress(addr);
}

/**
 * Shared viem PublicClient for Ethereum mainnet.
 * Singleton — keep one client instance to reuse keep-alive connections.
 */
const ethereumClient: PublicClient = createPublicClient({
    chain: mainnet,
    transport: http(ETHEREUM_RPC_URL, { timeout: HTTP_TIMEOUT_MS }),
});

/**
 * Returns the viem client for the given chain ID.
 * Currently only Ethereum mainnet is supported.
 * 
 * @param chainId - Numeric chain ID (e.g. 1 for Ethereum mainnet).
 * @throws Error if the chain ID is unsupported.
 */
export function getRpcClient(chainId: number): PublicClient {
    if (chainId !== mainnet.id) {
        throw new Error(`No RPC client configured for chainId ${chainId}`);
    }
    return ethereumClient;
}

/**
 * Fetches the deployed bytecode for a contract.
 *
 * @param address - Contract address.
 * @param chainId - Numeric chain ID (e.g. 1 for Ethereum mainnet).
 * @returns The 0x-prefixed bytecode hex string, or `null` if the address is an EOA
 * (no code deployed) — viem returns `undefined` in that case.
 */
export async function fetchBytecode(address: string, chainId: number): Promise<string | null> {
    const client = getRpcClient(chainId);
    const code = await client.getCode({ address: toAddress(address) });
    return code ?? null;
}

/**
 * Reads a single 32-byte storage slot via `eth_getStorageAt`. Used to detect
 * proxies by their well-known implementation slots (EIP-1967, Safe master copy)
 * without relying on getter functions, which can revert (transparent proxies)
 * or be missing from the proxy's ABI (Safe).
 *
 * @returns The 32-byte hex word at the slot, or `null` on RPC error.
 */
export async function readStorageAt(
    address: string,
    slot: `0x${string}`,
    chainId: number = mainnet.id,
): Promise<`0x${string}` | null> {
    const client = getRpcClient(chainId);
    try {
        const raw = await client.getStorageAt({ address: toAddress(address), slot });
        return raw ?? null;
    } catch {
        return null;
    }
}

/**
 * Reads a single contract function via `eth_call`.
 *
 * @param address - Target contract address.
 * @param abi - ABI fragment containing at least the function being called.
 * @param functionName - Name of the function to call.
 * @param args - Arguments tuple matching the function signature.
 * @param chainId - Numeric chain ID (e.g. 1 for Ethereum mainnet).
 * @returns The decoded return value.
 * @throws Error when the call reverts or the function is missing from the ABI.
 */
export async function readContract<TReturn = unknown>(
    address: string,
    abi: Abi,
    functionName: string,
    args: readonly unknown[] = [],
    chainId: number = mainnet.id,
): Promise<TReturn> {
    const client = getRpcClient(chainId);
    return (await client.readContract({
        address: toAddress(address),
        abi,
        functionName,
        args,
    })) as TReturn;
}

/**
 * Batches multiple contract reads into a single Multicall3 round trip.
 * Massive performance win for adapters that need to read many getters from one contract.
*
 * @param calls - Array of contract call specifications.
 * @param chainId - Numeric chain ID (e.g. 1 for Ethereum mainnet).
 * @returns An array aligned with `calls`. Each element is `{ status: 'success', result }`
 * or `{ status: 'failure', error }`. Failures are returned, not thrown — callers
 * decide how to handle each (a missing optional getter is not a fatal error).
 */
export async function multicall(
    calls: { address: string; abi: Abi; functionName: string; args?: readonly unknown[] }[],
    chainId: number = mainnet.id,
): Promise<({ status: 'success'; result: unknown } | { status: 'failure'; error: Error })[]> {
    const client = getRpcClient(chainId);
    const results = await client.multicall({
        contracts: calls.map((c) => ({
            address: toAddress(c.address),
            abi: c.abi,
            functionName: c.functionName,
            args: c.args ?? [],
        })),
        allowFailure: true,
    });

    return results.map((r) =>
        r.status === 'success'
            ? { status: 'success' as const, result: r.result }
            : { status: 'failure' as const, error: r.error as Error },
    );
}
