import dotenv from 'dotenv';

dotenv.config();

/* ==================== Environment ==================== */

export const DEVELOPMENT: boolean = process.env.NODE_ENV === 'development';
export const TEST: boolean = process.env.NODE_ENV === 'test';

/* ==================== Server ==================== */

export const SERVER_HOSTNAME: string = process.env.SERVER_HOSTNAME ?? 'localhost';
export const SERVER_PORT: number = process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : 3000;

export const SERVER = {
    hostname: SERVER_HOSTNAME,
    port: SERVER_PORT
};

/* ==================== Chains ==================== */

export const ETHEREUM_MAINNET_CHAIN_ID: number = process.env.ETHEREUM_MAINNET_CHAIN_ID
    ? Number(process.env.ETHEREUM_MAINNET_CHAIN_ID)
    : 1;

export const CHAIN_IDS = {
    ethereum: ETHEREUM_MAINNET_CHAIN_ID,
} as const;

/* ==================== External APIs ==================== */

export const SOURCIFY_BASE_URL: string = 'https://sourcify.dev/server';
export const ETHERSCAN_BASE_URL: string = 'https://api.etherscan.io/v2/api';
export const DEFILLAMA_BASE_URL: string = 'https://api.llama.fi';

export const ETHERSCAN_API_KEY: string = process.env.ETHERSCAN_API_KEY ?? '';
export const ETHEREUM_RPC_URL: string =
    process.env.ETHEREUM_RPC_URL ?? 'https://ethereum-rpc.publicnode.com';

/* ==================== Limits & Timeouts ==================== */

// Maximum BFS depth allowed by the API.
export const MAX_GRAPH_DEPTH: number = 5;
// Default BFS depth when client does not provide one.
export const DEFAULT_GRAPH_DEPTH: number = 3;
// Maximum number of nodes a single graph request can resolve.
export const MAX_GRAPH_NODES: number = 50;
// Outbound HTTP timeout for external API calls (ms).
export const HTTP_TIMEOUT_MS: number = 8000;
// Cache TTL for resolved contracts (ms). 1 hour — contract identity rarely changes.
export const RESOLVER_CACHE_TTL_MS: number = 60 * 60 * 1000;
// Cache TTL for TVL values (ms). 5 minutes — balances change continuously.
export const TVL_CACHE_TTL_MS: number = 5 * 60 * 1000;

/* ==================== Rate Limiting ==================== */

export const RATE_LIMIT_WINDOW_MS: number = 60 * 1000;
export const RATE_LIMIT_MAX_REQUESTS: number = 30;
