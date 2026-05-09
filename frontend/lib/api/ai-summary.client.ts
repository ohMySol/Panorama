import type { GraphResponse } from '@risk-terminal/shared';
import { ApiClientError, getDefaultConfig, type ApiClientConfig } from './graph.client';

/**
 * Response from POST /api/ai/summary
 */
export interface AiSummaryResponse {
  summary: string;
}

/**
 * Generate AI summary for a protocol graph
 * 
 * @param graphData - The complete graph response data
 * @param config - API client configuration
 * @returns Promise resolving to AI-generated summary
 * @throws ApiClientError on validation, network, or server errors
 */
export async function generateAiSummary(
  graphData: GraphResponse,
  config: ApiClientConfig = getDefaultConfig()
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000);

  try {
    const response = await fetch(`${config.baseUrl}/api/ai/summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(graphData),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new ApiClientError(
        'AI_SUMMARY_ERROR',
        `Failed to generate AI summary: ${response.status}`,
        response.status
      );
    }

    const data: AiSummaryResponse = await response.json();
    return data.summary;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiClientError) {
      console.error('[AI Summary Error]', error);
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      const timeoutError = new ApiClientError(
        'TIMEOUT',
        'AI summary request timeout',
        undefined,
        error
      );
      console.error('[AI Summary Error]', timeoutError);
      throw timeoutError;
    }

    const networkError = new ApiClientError(
      'NETWORK_ERROR',
      'Network request failed',
      undefined,
      error
    );
    console.error('[AI Summary Error]', networkError);
    throw networkError;
  }
}
