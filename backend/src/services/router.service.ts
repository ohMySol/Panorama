import type { AbiItem } from '../clients/sourcify.client';

export type { AdapterKind } from './manifests/types';

/**
 * Extracts the set of function names declared in an ABI. Shared by the manifest
 * registry (for fingerprint matching) and by risk profiles (for signature-based
 * detection of upgradeability, mint authority, etc.).
 */
export function getAbiFunctionNames(abi: AbiItem[]): Set<string> {
    const names = new Set<string>();
    for (const item of abi) {
        if (item.type === 'function' && typeof item.name === 'string') {
            names.add(item.name);
        }
    }
    return names;
}
