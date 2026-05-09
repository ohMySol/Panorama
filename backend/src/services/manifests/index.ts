import type { AbiItem } from '../../clients/sourcify.client';
import { getAbiFunctionNames } from '../router.service';
import erc20 from './protocols/erc20.json';
import morphoV1 from './protocols/morpho-vault-v1.json';
import morphoV2 from './protocols/morpho-vault-v2.json';
import type { ProtocolManifest } from './types';

/**
 * Ordered registry. First fingerprint that fully matches wins, so the more
 * specific protocol must come before broader ones — a MetaMorpho vault is also
 * an ERC-4626/ERC-20, so `morpho` must precede `erc20`.
 */
const MANIFESTS: readonly ProtocolManifest[] = [
    morphoV1 as ProtocolManifest,
    morphoV2 as ProtocolManifest,
    erc20 as ProtocolManifest,
];

/**
 * Returns the first manifest whose fingerprint is fully present in the ABI,
 * or `null` when nothing matches (caller treats as `fallback` / leaf).
 */
export function selectManifest(abi: AbiItem[]): ProtocolManifest | null {
    const functions = getAbiFunctionNames(abi);
    for (const manifest of MANIFESTS) {
        if (manifest.fingerprint.every((fn) => functions.has(fn))) return manifest;
    }
    return null;
}

export { executeManifest } from './executor';
export type { AdapterDependency, AdapterKind, ProtocolManifest } from './types';
