import { getAbiFunctionNames } from '../../router.service';
import type { RiskCheck, RiskFinding } from '../types';

/**
 * Token-specific risk checks. Run only when the router classifies a contract
 * as ERC-20. Detects mechanisms that can disrupt expected token behaviour:
 * blacklisting, transfer fees, mintability, etc.
 */
const TOKEN_CHECKS: {
    id: string;
    signatures: string[];
    severity: RiskFinding['severity'];
    label: string;
    weight: number;
}[] = [
    {
        id: 'token:blacklistable',
        signatures: ['blacklist', 'isBlacklisted', 'addToBlacklist'],
        severity: 'critical',
        label: 'Issuer can freeze individual addresses',
        weight: 25,
    },
    {
        id: 'token:feeOnTransfer',
        signatures: ['taxFee', 'liquidityFee', 'transferFee'],
        severity: 'warning',
        label: 'Charges fee on transfer',
        weight: 15,
    },
    {
        id: 'token:mintable',
        signatures: ['mint'],
        severity: 'warning',
        label: 'Mintable supply',
        weight: 10,
    },
    {
        id: 'token:burnable',
        signatures: ['burn'],
        severity: 'info',
        label: 'Burnable supply',
        weight: 3,
    },
];

/**
 * Runs all token checks and returns matching findings.
 */
export const tokenRiskCheck: RiskCheck = (abi) => {
    const functions = getAbiFunctionNames(abi);
    const findings: RiskFinding[] = [];

    for (const check of TOKEN_CHECKS) {
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
