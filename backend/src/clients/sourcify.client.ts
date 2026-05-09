import { SOURCIFY_BASE_URL } from '../config/config';
import { fetchWithTimeout } from './http';

/**
 * One parameter inside an ABI item (function input/output, event arg, etc.).
 */
interface AbiParameter {
    name: string;
    type: string;
    components?: AbiParameter[];
}

/**
 * One item from the Ethereum ABI specification — function, event, error, etc.
 * Exported because services and adapters introspect ABI items by name.
 */
export interface AbiItem {
    type: 'function' | 'event' | 'error' | 'constructor' | 'fallback' | 'receive';
    name?: string;
    inputs?: AbiParameter[];
    outputs?: AbiParameter[];
    stateMutability?: 'pure' | 'view' | 'nonpayable' | 'payable';
    anonymous?: boolean;
}

/**
 * Internal shape of the Sourcify v2 contract endpoint response.
 * Not exported — consumers receive `SourcifyContract`.
 */
interface SourcifyResponse {
    address: string;
    chainId: string;
    matchType: 'full_match' | 'partial_match';
    abi: AbiItem[];
    metadata: {
        settings?: {
            compilationTarget?: Record<string, string>;
        };
    };
}

/**
 * Normalised Sourcify result returned to the resolver.
 *
 * @param address - The contract address as reported by Sourcify (checksummed).
 * @param name - Contract name extracted from the metadata, or null if unavailable.
 * @param abi - The contract's full ABI.
 * @param isFullMatch - True when Sourcify produced a reproducible build match.
 */
export interface SourcifyContract {
    address: string;
    name: string | null;
    abi: AbiItem[];
    isFullMatch: boolean;
}

/**
 * Fetches a verified contract from Sourcify by chain + address.
 *
 * @param address - 0x-prefixed contract address.
 * @param chainId - Numeric chain ID (e.g. 1 for Ethereum mainnet).
 * @returns The contract record, or `null` if Sourcify has no record (404).
 * @throws Error on non-404 HTTP failures or network errors.
 */
export async function fetchFromSourcify(
    address: string,
    chainId: number,
): Promise<SourcifyContract | null> {
    const url = `${SOURCIFY_BASE_URL}/v2/contract/${chainId}/${address}?fields=abi,metadata`;

    const response = await fetchWithTimeout(url);

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error(`Sourcify API error ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as SourcifyResponse;

    const compilationTarget = data.metadata?.settings?.compilationTarget ?? {};
    const name = Object.values(compilationTarget)[0] ?? null;

    return {
        address: data.address,
        name,
        abi: data.abi,
        isFullMatch: data.matchType === 'full_match',
    };
}
