/**
 * API configuration constants
 */
export const API_CONFIG = {
  /**
   * Backend base URL - reads from NEXT_PUBLIC_API_URL env var
   * Defaults to localhost:5000 for development
   */
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  
  /**
   * Request timeout in milliseconds
   */
  TIMEOUT_MS: 30000,
  
  /**
   * Default graph depth when not specified
   */
  DEFAULT_DEPTH: 3,
  
  /**
   * Maximum allowed graph depth
   */
  MAX_DEPTH: 5,
  
  /**
   * Supported chain IDs
   */
  SUPPORTED_CHAINS: {
    ethereum: 1,
  } as const,
} as const;

export type SupportedChainId = typeof API_CONFIG.SUPPORTED_CHAINS[keyof typeof API_CONFIG.SUPPORTED_CHAINS];
