import type { Abi } from 'viem';

/**
 * Stable string identifying a protocol family. Used by the risk profile registry
 * (`risk/index.ts`) and surfaced on `GraphNode.type`.
 */
export type AdapterKind = 'morphoBlue' | 'morpho' | 'morphoV2' | 'erc20' | 'safe' | 'fallback';

/**
 * One outbound edge a manifest discovered for a contract.
 *
 * `from` overrides the edge origin and depth anchor; defaults to the resolved
 * contract being processed. Used when the dependency is conceptually owned by
 * a downstream contract (e.g. a Morpho Blue market dependency belongs to
 * Morpho Blue, not the vault that referenced the market).
 * @param to - Target contract address.
 * @param type - Edge label, used by the manifest executor and risk checks to
 *   distinguish different dependency types (e.g. `supplyQueue` vs `withdrawQueue`).
 * @param from - Optional override for the edge origin; when set, the manifest
 *   executor attributes this dependency to `from` rather than the resolved
 */
export interface AdapterDependency {
    to: string;
    type: string;
    from?: string;
}

/**
 * Declarative description of how to discover a contract's dependencies.
 * Manifests replace per-protocol TypeScript adapters: a single executor reads
 * any manifest and runs the same multicall pipeline.
 *
 * Fingerprint matching is first-match-wins; the order of `MANIFESTS` in
 * `index.ts` defines priority (more specific kinds before broader ones).
 * 
 * @param id - Stable string identifier, used as `GraphNode.type` and by the risk profile registry.
 * @param fingerprint - Function names that must all be present in the ABI to match this manifest.
 * @param directCalls - Single getters returning an address; each becomes one direct edge.
 * @param paginatedCalls - Length-prefixed indexed getters; optionally followed by a cross-contract lookup.

 */
export interface ProtocolManifest {
    id: AdapterKind;
    /**
     * Human-readable category surfaced on `GraphNode.category`. Drives the
     * category chip in the UI ("Vault", "Market", "Token", "Multisig",
     * "Oracle", …) and is also useful for grouping / colouring nodes.
     * Distinct from `id` — multiple manifests can share a category (Morpho V1
     * and Morpho V2 are both "Vault").
     */
    category: string;
    fingerprint: string[];
    directCalls?: DirectCall[];
    paginatedCalls?: PaginatedCall[];
    /**
     * Render-only contract facts (symbols, signer counts, thresholds, …).
     * Run on the contract being analysed alongside the direct calls; never
     * produce edges. Each call's result is projected and stored at
     * `GraphNode.metadata[field]`.
     */
    metadataCalls?: MetadataCall[];
}

/**
 * A call that returns an address to follow directly.
 * @param function - Function name on the resolved contract; must exist in its ABI.
 * @param role - Edge label and the role this address can be referenced by in `FollowUp.addressFromRole`.
 */
export interface DirectCall {
    function: string;
    role: string;
}

/**
 * A call that returns a list of items to follow, discovered by iterating from 0 to a length.
 * @param sources - Sources whose item lists will be unioned (e.g. `supplyQueue` + `withdrawQueue`).
 * Each source must declare a length getter (uint) and an indexed item getter.
 * @param itemType - Whether items are addresses (direct edges) or bytes32 IDs (require a `followUp`).
 * @param maxItemsPerSource - Per-source cap on items inspected. Bounds RPC cost for large queues.
 * @param role - Optional edge label and the role these addresses can be referenced by in `FollowUp.addressFromRole`.
 * @param followUp - Optional cross-contract lookup step, used when items are bytes32 identifiers rather than direct addresses.
 */
export interface PaginatedCall {
    sources: { lengthFunction: string; itemFunction: string }[];
    itemType: 'address' | 'bytes32';
    maxItemsPerSource: number;
    role?: string;
    followUp?: FollowUp;
}

/**
 * When a manifest's paginated call returns bytes32 identifiers rather than direct addresses, this describes how to unpack them.
 * The manifest executor will perform the described calls on the same contract to extract follow-up addresses to connect in the graph.
 * `addressFromRole` references the role of a `DirectCall` whose result is the target address for these follow-ups.
 * This indirection allows multiple paginated calls to share the same follow-up logic, anchored at the same target contract.
 * 
 * @param addressfromRole - Role of a `DirectCall` whose result is the contract to call.
 * @param function - Inline ABI fragment for the function — the followUp target's ABI is not
 * resolved separately, so the manifest must describe the signature itself.
 * @param extract - Tuple-output extraction: pick fields by position and assign each a role.
 * @param anchorFromTarget - When true, emitted edges set `from = target`, anchoring depth at the target node.
 */
export interface FollowUp {
    addressFromRole: string;
    function: Abi[number];
    extract: { index: number; role: string }[];
    anchorFromTarget: boolean;
}

/**
 * One render-only fact extracted from the contract being analysed.
 *
 * The function must exist in the resolved ABI (same security guarantee as
 * direct calls). The decoded return value is projected and stored at
 * `GraphNode.metadata[field]`:
 *   - `length`   — `value.length` (use for `address[]` getters like `getOwners`)
 *   - default    — bigint coerced to number; string / boolean / number kept as-is
 *
 * @param function - View function on the resolved contract.
 * @param field    - Key under `GraphNode.metadata` for the projected value.
 * @param project  - Optional projection applied to the decoded result.
 */
export interface MetadataCall {
    function: string;
    field: string;
    project?: 'length';
}

/**
 * Output of `executeManifest`. `dependencies` drives BFS traversal; `metadata`
 * is attached to the node and surfaced to the frontend.
 */
export interface ManifestResult {
    dependencies: AdapterDependency[];
    metadata: Record<string, string | number | boolean>;
}
