import { useMutation, useQuery, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import type { GraphResponse } from '@risk-terminal/shared';
import { buildGraph, type BuildGraphRequest } from '@/lib/api/graph.client';

const GRAPH_QUERY_KEY = ['graph', 'latest'];

/**
 * Hook for building dependency graphs
 * 
 * @returns Mutation object with mutate function and state
 */
export function useBuildGraph(): UseMutationResult<
  GraphResponse,
  Error,
  BuildGraphRequest,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: BuildGraphRequest) => buildGraph(request),
    onSuccess: (data) => {
      // Store the result in cache with a stable key
      queryClient.setQueryData(GRAPH_QUERY_KEY, data);
    },
  });
}

/**
 * Hook for accessing the most recent graph analysis result
 * 
 * @returns Query object with data and state
 */
export function useLatestGraphAnalysis() {
  const { data, isLoading, error } = useQuery<GraphResponse>({
    queryKey: GRAPH_QUERY_KEY,
    queryFn: () => {
      // This query doesn't fetch - it only reads from cache
      throw new Error('No graph data available');
    },
    enabled: false, // Never auto-fetch
    retry: false,
  });

  return {
    data,
    isLoading,
    error: error as Error | null,
  };
}
