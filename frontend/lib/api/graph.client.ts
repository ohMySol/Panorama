import type { GraphResponse, ApiError } from '@risk-terminal/shared';

/**
 * Request payload for POST /api/graph
 */
export interface BuildGraphRequest {
  address: string;
  chain_id: number;
  depth?: number;
}

/**
 * Configuration for the API client
 */
export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
}

/**
 * Custom error class for API errors
 */
export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Gets the default API client configuration from environment
 */
export function getDefaultConfig(): ApiClientConfig {
  return {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    timeout: 30000,
  };
}

/**
 * Builds a dependency graph for the given contract address
 * 
 * @param request - The graph build request parameters
 * @param config - API client configuration
 * @returns Promise resolving to GraphResponse
 * @throws ApiClientError on validation, network, or server errors
 */
export async function buildGraph(
  request: BuildGraphRequest,
  config: ApiClientConfig = getDefaultConfig()
): Promise<GraphResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000);

  try {
    const response = await fetch(`${config.baseUrl}/api/graph`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Try to parse error response
      try {
        const errorData: ApiError = await response.json();
        throw new ApiClientError(
          errorData.code,
          errorData.message,
          response.status
        );
      } catch (parseError) {
        // If parsing fails, throw generic error
        throw new ApiClientError(
          'UNKNOWN_ERROR',
          `Request failed with status ${response.status}`,
          response.status,
          parseError
        );
      }
    }

    const data: GraphResponse = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiClientError) {
      console.error('[API Client Error]', {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      });
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      const timeoutError = new ApiClientError(
        'TIMEOUT',
        'Request timeout exceeded',
        undefined,
        error
      );
      console.error('[API Client Error]', timeoutError);
      throw timeoutError;
    }

    // Network or other errors
    const networkError = new ApiClientError(
      'NETWORK_ERROR',
      'Network request failed',
      undefined,
      error
    );
    console.error('[API Client Error]', networkError);
    throw networkError;
  }
}
