import type { ErrorRequestHandler } from 'express';
import type { ApiError } from '@risk-terminal/shared';
import { DEVELOPMENT } from '../config/config';

/**
 * Global Express error handler. Mounted last in `app.ts`.
 *
 * Responsibilities:
 *   - Catch any error not handled inside a controller.
 *   - Log the full error server-side for diagnostics.
 *   - Return a typed `ApiError` to the client without leaking stack traces in production.
 *
 * In development the error message is forwarded to the client to aid debugging;
 * in production a generic message is returned to avoid information disclosure.
 */
export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error('[error]', err);

    const message =
        DEVELOPMENT && err instanceof Error
            ? err.message
            : 'An unexpected error occurred. Please try again.';

    const body: ApiError = {
        code: 'RESOLUTION_FAILED',
        message,
    };

    res.status(500).json(body);
};
