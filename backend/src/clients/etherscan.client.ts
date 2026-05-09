import { ETHERSCAN_API_KEY, ETHERSCAN_BASE_URL } from '../config/config';
import { fetchWithTimeout } from './http';
import type { AbiItem } from './sourcify.client';

/**
 * Internal Etherscan v2 `getsourcecode` response interface.
 * Etherscan returns an array with a single element for any address query.
 */
interface EtherscanSourceCodeItem {
    SourceCode: string;
    ABI: string;
    ContractName: string;
    Proxy: string;
    Implementation: string;
}

interface EtherscanResponse {
    status: '0' | '1';
    message: string;
    result: EtherscanSourceCodeItem[] | string;
}

/**
 * Normalised Etherscan result returned to the resolver.
 *
 * @param address - The address that was queried.
 * @param name - Contract name as reported by Etherscan, or null if unavailable.
 * @param abi - Parsed ABI array.
 * @param implementation - For proxies, the address of the implementation contract; null otherwise.
 */
export interface EtherscanContract {
    address: string;
    name: string | null;
    abi: AbiItem[];
    implementation: string | null;
}

/**
 * Fetches a verified contract from Etherscan by chain + address.
 *
 * @param address - 0x-prefixed contract address.
 * @param chainId - Numeric chain ID (e.g. 1 for Ethereum mainnet).
 * @returns The contract record, or `null` if Etherscan has no record.
 * 
 * Returns `null` for any of these "not available" cases (all expected):
 * - The contract is not verified on Etherscan.
 * - Etherscan returns an empty ABI string ("Contract source code not verified").
 * - The API key is missing in the environment.
 *
 * @throws Error on network failures or unexpected response shapes.
 */
export async function fetchFromEtherscan(
    address: string,
    chainId: number,
): Promise<EtherscanContract | null> {
    if (!ETHERSCAN_API_KEY) return null;

    const url =
        `${ETHERSCAN_BASE_URL}` +
        `?chainid=${chainId}` +
        `&module=contract` +
        `&action=getsourcecode` +
        `&address=${address}` +
        `&apikey=${ETHERSCAN_API_KEY}`;

    const response = await fetchWithTimeout(url);

    if (!response.ok) {
        throw new Error(`Etherscan API error ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as EtherscanResponse;

    if (data.status !== '1' || !Array.isArray(data.result) || data.result.length === 0) {
        return null;
    }

    const item = data.result[0];

    // Etherscan returns this exact string when the contract is unverified.
    if (item.ABI === 'Contract source code not verified') {
        return null;
    }

    let abi: AbiItem[];
    try {
        abi = JSON.parse(item.ABI) as AbiItem[];
    } catch {
        throw new Error(`Etherscan returned malformed ABI for ${address}`);
    }

    return {
        address,
        name: item.ContractName?.length > 0 ? item.ContractName : null,
        abi,
        implementation:
            item.Proxy === '1' && item.Implementation?.length > 0 ? item.Implementation : null,
    };
}
