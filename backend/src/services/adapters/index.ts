import type { AdapterKind } from '../router.service';
import type { Adapter } from './types';
import { morphoAdapter } from './morpho.adapter';
import { morphoVaultV2Adapter } from './morpho-vault-v2.adapter';
import { erc20Adapter } from './erc20.adapter';
import { fallbackAdapter } from './fallback.adapter';

/**
 * Single source of truth that maps each `AdapterKind` to its implementation.
 * Add a new adapter here when you add a new entry to `AdapterKind`.
 */
const ADAPTER_REGISTRY: Record<AdapterKind, Adapter> = {
    morpho: morphoAdapter,
    morphoV2: morphoVaultV2Adapter,
    erc20: erc20Adapter,
    fallback: fallbackAdapter,
};

/**
 * Looks up the adapter for a kind. Total over `AdapterKind` — never returns undefined.
 */
export function getAdapter(kind: AdapterKind): Adapter {
    return ADAPTER_REGISTRY[kind];
}

export type { Adapter, AdapterDependency } from './types';
