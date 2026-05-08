import type { AbiItem } from '../clients/sourcify.client';

/**
 * Identifies which adapter should handle a contract based on its ABI signatures.
 * Add a new entry here whenever a new adapter is registered.
 */
export type AdapterKind = 'morpho' | 'morphoV2' | 'erc20' | 'fallback';

/**
 * One entry in the signature registry: a set of function names that, if all present
 * in an ABI, identify the contract as belonging to a given adapter.
 *
 * The registry is ordered — the first match wins. More specific contract types
 * (e.g. MetaMorpho vault, which is also an ERC-20) must come before broader ones.
 */
interface SignatureRule {
    kind: AdapterKind;
    requiredFunctions: readonly string[];
}

/**
 * 
 */
const SIGNATURE_REGISTRY: readonly SignatureRule[] = [
    { kind: 'morpho', requiredFunctions: ['asset', 'MORPHO', 'supplyQueue'] },
    { kind: 'morphoV2', requiredFunctions: ['asset', 'adaptersLength', 'adapterRegistry', 'liquidityAdapter'] },
    { kind: 'erc20', requiredFunctions: ['transfer', 'balanceOf', 'totalSupply'] },
];

/**
 * Extracts the set of function names declared in an ABI.
 * Used by the router and by risk profiles for signature-based detection.
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

/**
 * Determines which adapter to use for a contract given its ABI.
 *
 * @param abi - The contract's ABI as returned by Sourcify or Etherscan.
 * @returns The adapter kind to invoke. Falls back to `'fallback'` when no rule matches
 *          and to `'erc20'` when only ERC-20 signatures are found.
 */
export function selectAdapter(abi: AbiItem[]): AdapterKind {
    const functionNames = getAbiFunctionNames(abi);

    for (const rule of SIGNATURE_REGISTRY) {
        const matches = rule.requiredFunctions.every((fn) => functionNames.has(fn));
        if (matches) return rule.kind;
    }

    return 'fallback';
}
