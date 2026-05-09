/**
 * Generic TTL-aware in-memory cache.
 *
 * Implemented as a class so consumers can hold one instance per data domain
 * (resolved contracts, TVL values, etc.). The interface is intentionally
 * minimal so the implementation can later be swapped for Redis without
 * touching consumers — they only depend on `get` / `set` / `delete`.
 */
export class TtlCache<TKey, TValue> {
    private readonly store = new Map<TKey, { value: TValue; expiresAt: number }>();
    private readonly ttlMs: number;

    /**
     * @param ttlMs - Lifetime of every entry in milliseconds.
     */
    constructor(ttlMs: number) {
        this.ttlMs = ttlMs;
    }

    /**
     * Returns the value if present and not expired; otherwise `undefined`.
     * Expired entries are evicted on access (lazy eviction).
     */
    get(key: TKey): TValue | undefined {
        const entry = this.store.get(key);
        if (!entry) return undefined;
        if (entry.expiresAt < Date.now()) {
            this.store.delete(key);
            return undefined;
        }
        return entry.value;
    }

    /**
     * Stores a value under the key with the cache's TTL.
     */
    set(key: TKey, value: TValue): void {
        this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    }

    /**
     * Removes the entry. No-op if the key is absent.
     */
    delete(key: TKey): void {
        this.store.delete(key);
    }

    /**
     * Removes all entries.
     */
    clear(): void {
        this.store.clear();
    }
}
