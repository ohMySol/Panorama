export function logError(
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>
): void {
  console.error(`[${context}]`, {
    error,
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    ...metadata,
  });
  
  // Future: Send to error tracking service (Sentry, LogRocket, etc.)
}
