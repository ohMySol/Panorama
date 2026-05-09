import type { ContractTier, GraphNode } from '@risk-terminal/shared';
import type { RiskFinding } from './risk';

/**
 * Base score contributed by trust tier. Higher = riskier.
 * Tier 1 (Sourcify) = lowest risk; Tier 5 (Unknown) = highest.
 */
const TIER_BASE_SCORE: Record<ContractTier, number> = {
    1: 5,
    2: 15,
    3: 25,
    4: 35,
    5: 60,
};

/**
 * Severity multipliers applied to each finding's base weight.
 * Critical findings count more than informational ones.
 */
const SEVERITY_MULTIPLIER: Record<RiskFinding['severity'], number> = {
    info: 0.5,
    warning: 1.0,
    critical: 1.5,
};

/**
 * Computes a per-node risk score in [0, 100].
 * Formula: `clamp(tierBase + sum(finding.weight * severityMultiplier), 0, 100)`.
 *
 * Pure function — same inputs always yield the same output.
 *
 * @param tier - Trust tier from the resolver.
 * @param findings - Risk findings produced by `runRiskChecks`.
 * @returns Integer score in [0, 100].
 */
export function scoreNode(tier: ContractTier, findings: RiskFinding[]): number {
    const base = TIER_BASE_SCORE[tier];
    const findingsContribution = findings.reduce(
        (sum, f) => sum + f.weight * SEVERITY_MULTIPLIER[f.severity],
        0,
    );
    const total = base + findingsContribution;
    return Math.max(0, Math.min(100, Math.round(total)));
}

/**
 * Computes the overall graph risk score from the per-node scores.
 *
 * Strategy: weighted average where the root node (depth 0) and direct dependencies
 * (depth 1) carry more weight than deep transitive dependencies. Reflects that a
 * vulnerability in the root or its immediate neighbours has greater impact than
 * one buried five hops away.
 *
 * @param nodes - All graph nodes.
 * @param rootAddress - Address of the user-submitted root.
 * @param depthByAddress - Map from lowercased address to BFS depth.
 * @returns Integer score in [0, 100].
 */
export function scoreGraph(
    nodes: GraphNode[],
    rootAddress: string,
    depthByAddress: Map<string, number>,
): number {
    if (nodes.length === 0) return 0;

    let totalWeighted = 0;
    let totalWeight = 0;
    const rootKey = rootAddress.toLowerCase();

    for (const node of nodes) {
        const depth = depthByAddress.get(node.address.toLowerCase()) ?? 0;
        const isRoot = node.address.toLowerCase() === rootKey;
        const weight = isRoot ? 3 : Math.max(1, 3 - depth);
        totalWeighted += node.riskScore * weight;
        totalWeight += weight;
    }

    return Math.round(totalWeighted / totalWeight);
}
