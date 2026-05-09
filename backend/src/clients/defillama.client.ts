import { DEFILLAMA_BASE_URL, TVL_CACHE_TTL_MS } from '../config/config';
import { TtlCache } from '../services/cache.service';
import { fetchWithTimeout } from './http';

/**
 * Cached TVL values per protocol slug. DeFiLlama is rate-limited and slow (~500ms),
 * so even a 5-minute cache makes the difference between a snappy graph and a sluggish one.
 */
const tvlCache = new TtlCache<string, number | null>(TVL_CACHE_TTL_MS);

/**
 * Internal shape of the DeFiLlama `/protocol/{slug}` response (only the fields we use).
 */
interface DefiLlamaProtocolResponse {
    tvl?: number;
    currentChainTvls?: Record<string, number>;
}

/**
 * Fetches the current TVL (in USD) for a protocol by its DeFiLlama slug.
 *
 * @param slug - DeFiLlama protocol slug (e.g. "morpho-blue", "aave-v3").
 * @returns USD TVL, or `null` if the protocol is unknown to DeFiLlama.
 * @throws Error on unexpected HTTP failures (5xx, network errors).
 */
export async function fetchTvl(slug: string): Promise<number | null> {
    const cached = tvlCache.get(slug);
    if (cached !== undefined) return cached;

    const response = await fetchWithTimeout(`${DEFILLAMA_BASE_URL}/protocol/${slug}`);

    if (response.status === 404) {
        tvlCache.set(slug, null);
        return null;
    }

    if (!response.ok) {
        throw new Error(`DeFiLlama API error ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as DefiLlamaProtocolResponse;
    const tvl = data.tvl ?? null;

    tvlCache.set(slug, tvl);
    return tvl;
}
