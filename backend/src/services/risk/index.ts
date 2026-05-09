import type { AdapterKind } from '../router.service';
import type { AbiItem } from '../../clients/sourcify.client';
import { universalRiskCheck } from './universal';
import { tokenRiskCheck } from './profiles/token';
import type { RiskCheck, RiskFinding } from './types';

/**
 * Maps each `AdapterKind` to the kind-specific check that should run for it.
 * Add an entry whenever a new profile (e.g. oracle, vault) is introduced.
 *
 * The universal check runs in addition to whatever is configured here — see `runRiskChecks`.
 */
const PROFILE_REGISTRY: Partial<Record<AdapterKind, RiskCheck>> = {
    erc20: tokenRiskCheck,
};

/**
 * Runs the universal check plus any kind-specific profile against an ABI.
 * Aggregates and deduplicates findings by `id` (defensive — overlapping IDs
 * should never happen, but if they do, the first wins).
 *
 * @param abi - Contract ABI; if null, no checks run and an empty array is returned.
 * @param kind - Adapter kind chosen by the router for this contract.
 * @returns Combined list of findings.
 */
export function runRiskChecks(abi: AbiItem[] | null, kind: AdapterKind): RiskFinding[] {
    if (abi === null) return [];

    const findings: RiskFinding[] = [];
    const seen = new Set<string>();

    const allChecks: RiskCheck[] = [universalRiskCheck];
    const profile = PROFILE_REGISTRY[kind];
    if (profile) allChecks.push(profile);

    for (const check of allChecks) {
        for (const finding of check(abi)) {
            if (seen.has(finding.id)) continue;
            seen.add(finding.id);
            findings.push(finding);
        }
    }

    return findings;
}

export type { RiskFinding } from './types';
