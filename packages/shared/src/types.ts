// Shared types for the project

export interface ApiError {
    code: 'INVALID_ADDRESS' | 'RESOLUTION_FAILED' | 'DEPTH_EXCEEDED' | 'EXTERNAL_API_ERROR' | 'INVALID_CHAIN_ID';
    message: string;
}

export type ContractTier = 1 | 2 | 3 | 4 | 5;

/**
 * Represents a contract (dependency) that has been found in the main contract with its resolved information.
 * @param address - The address of the contract.
 * @param name - The name of the contract.
 * @param tier - The tier of the contract.
 * @param abi - The ABI of the contract.
 * @param sourceAvailable - Whether the source code of the contract is available.
 */
export interface ResolvedDependency {
    address: string;
    name: string | null;
    tier: ContractTier;
    abi: string | null;
    sourceAvailable: boolean;
}

/**
 * Represents a node in the dependency graph, which extends the ResolvedDependency with additional information.
 * @param riskScore - The risk score of the node (0-100 per node).
 * @param riskFlags - The risk points associated with the node (e.g., ["upgradeable", "RBAC", "timelocks"]).
 * @param tvlUsd - The total value locked in USD for the node (if applicable) from DeFiLlama.
 * @param type - The type of the node in the graph (e.g., "oracle", "token", "pool", etc.).
 * @param metadata - Manifest-extracted, render-ready facts (e.g. token `symbol`, multisig
 *   `signerCount` / `signerThreshold`). Keyed strings come straight from the manifest's
 *   `metadataCalls[].field`; consumers should treat unknown keys as optional.
 */
export interface GraphNode  extends ResolvedDependency {
    riskScore: number;
    riskFlags: string[];
    tvlUsd: number | null;
    type: string;
    metadata: Record<string, string | number | boolean>;
}

/**
 * Represents an edge in the dependency graph, which connects two nodes with a specific type of relationship.
 * @param from - The address of the source node.
 * @param to - The address of the target node.
 * @param type - The type of relationship (e.g., "oracle data fetching", "token transfer", etc.).
 */
export interface GraphEdge {
    from: string;
    to: string;
    type: string;
}

/**
 * Represents the response of the graph analysis.
 * @param root - The address of the root contract (this is the contract address the user submitted).
 * @param nodes - The list of nodes in the graph.
 * @param edges - The list of edges in the graph.
 * @param graphRiskScore - The overall risk score of the graph (0-100).
 * @param summary - A brief summary of the graph analysis, highlighting key risks and findings.
 */
export interface GraphResponse {
    root: string;
    nodes: GraphNode[];
    edges: GraphEdge[];
    graphRiskScore: number;
    summary: string | null;
}