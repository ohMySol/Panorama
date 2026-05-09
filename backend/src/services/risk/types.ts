import type { AbiItem } from '../../clients/sourcify.client';

/**
 * One risk finding produced by a check. Findings are flat strings on the
 * `GraphNode.riskFlags` array; the structured form below is what checks return
 * internally before the scorer flattens them.
 *
 * @param id - Unique identifier, e.g. `"universal:upgradeable"`.
 * @param severity - `"info"` (informational), `"warning"` (caution), `"critical"` (high impact).
 * @param label - Short human-readable label for the UI.
 * @param weight - Score penalty contribution (0–100). Scorer multiplies by severity weight.
 */
export interface RiskFinding {
    id: string;
    severity: 'info' | 'warning' | 'critical';
    label: string;
    weight: number;
}

/**
 * Function signature shared by every risk check. Pure: same ABI ⇒ same findings.
 *
 * @param abi - Contract ABI; never null because checks are only called when source is available.
 * @returns Zero or more findings.
 */
export type RiskCheck = (abi: AbiItem[]) => RiskFinding[];
