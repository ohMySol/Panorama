import { HTTP_TIMEOUT_MS } from '../config/config';

/**
 * `fetch` wrapper that aborts the request after `HTTP_TIMEOUT_MS`.
 * Prevents a hung external API from blocking a graph build indefinitely.
 * Every other client uses this instead of raw `fetch`.
 *
 * @param url - The URL to fetch.
 * @param init - Standard fetch options. A signal will be attached automatically.
 * @returns The Response object. The caller is responsible for status checks.
 * @throws DOMException with name 'AbortError' on timeout, or any network error from fetch.
 */
export async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);

    try {
        return await fetch(url, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timeoutId);
    }
}
