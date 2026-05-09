import { getAbiFunctionNames } from '../router.service';
import type { RiskCheck, RiskFinding } from './types';

/**
 * Universal checks run against every resolved contract regardless of its kind.
 * They detect concerns that apply broadly: upgradeability, admin keys, role-based
 * access control. Each check returns at most one finding and is independent.
 */
const UNIVERSAL_CHECKS: {
    id: string;
    signatures: string[];
    severity: RiskFinding['severity'];
    label: string;
    weight: number;
}[] = [
    {
        id: 'universal:upgradeable',
        signatures: ['upgradeTo', 'upgradeToAndCall', 'implementation'],
        severity: 'warning',
        label: 'Upgradeable proxy',
        weight: 20,
    },
    {
        id: 'universal:adminControlled',
        signatures: ['owner', 'admin', 'transferOwnership'],
        severity: 'warning',
        label: 'Admin / owner controlled',
        weight: 15,
    },
    {
        id: 'universal:pausable',
        signatures: ['pause', 'unpause'],
        severity: 'warning',
        label: 'Pausable',
        weight: 10,
    },
    {
        id: 'universal:roleBasedAccess',
        signatures: ['grantRole', 'revokeRole', 'hasRole'],
        severity: 'info',
        label: 'Role-based access control',
        weight: 5,
    },
];

/**
 * Runs all universal checks and returns the matching findings.
 * A check matches when *any* of its listed signatures is present in the ABI —
 * upgradeability is detectable by any one of the EIP-1967/UUPS function names.
 */
export const universalRiskCheck: RiskCheck = (abi) => {
    const functions = getAbiFunctionNames(abi);
    const findings: RiskFinding[] = [];

    for (const check of UNIVERSAL_CHECKS) {
        const matched = check.signatures.some((sig) => functions.has(sig));
        if (matched) {
            findings.push({
                id: check.id,
                severity: check.severity,
                label: check.label,
                weight: check.weight,
            });
        }
    }

    return findings;
};
