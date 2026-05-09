import { useQuery } from '@tanstack/react-query';
import type { GraphResponse } from '@risk-terminal/shared';
import { generateAiSummary } from '@/lib/api/ai-summary.client';

/**
 * Hook for generating AI summary of a protocol graph
 * 
 * @param graphData - The graph data to summarize
 * @param enabled - Whether to automatically fetch the summary
 * @returns Query object with summary data and state
 */
export function useAiSummary(graphData: GraphResponse | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ['ai-summary', graphData?.root],
    queryFn: async () => {
      if (!graphData) {
        throw new Error('No graph data available');
      }
      return generateAiSummary(graphData);
    },
    enabled: enabled && !!graphData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
