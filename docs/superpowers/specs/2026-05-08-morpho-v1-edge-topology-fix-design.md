# Morpho V1 Edge Topology Fix

**Date:** 2026-05-08

## Problem

The V1 MetaMorpho adapter (`morpho.adapter.ts`) emits oracle, IRM, collateralToken, and loanToken as direct edges from the vault. These are discovered from Morpho Blue market params, so they should be edges from Morpho Blue — not from the vault.

**Current (wrong):**
```
Vault → oracle
Vault → IRM
Vault → collateralToken
Vault → loanToken (market)
```

**Correct:**
```
Vault       → MORPHO Blue (protocolCore)
Vault       → asset (loanToken)
Vault       → curator, guardian, owner
MORPHO Blue → oracle (per market)
MORPHO Blue → IRM (per market)
MORPHO Blue → collateralToken (per market)
MORPHO Blue → loanToken (per market)
```

## Root Cause

`graph.service.ts` always sets `from: resolved.address` when creating edges. Adapters have no way to specify a different edge origin. The V1 adapter discovers market-level deps (oracle, IRM, collateral, loanToken) while processing the vault node, so they all get attributed to the vault.

## Approach

**Add `from?: string` to `AdapterDependency`** — minimal, surgical. One optional field on the existing type. No other adapters need to change. The graph service uses `dep.from` when present for both the edge origin and depth anchor.

## Architecture

### 1. `adapters/types.ts`

Add optional `from` to `AdapterDependency`:

```typescript
export interface AdapterDependency {
    to: string;
    type: string;
    from?: string; // overrides edge origin and depth anchor; defaults to resolved.address
}
```

### 2. `graph.service.ts` — BFS loop (lines 86–96)

**Edge creation:** use `dep.from` when present:
```typescript
const edgeFrom = dep.from ?? resolved.address;
edges.push({ from: edgeFrom, to: dep.to, type: dep.type });
```

**Depth calculation:** anchor to `dep.from`'s recorded depth when present. `dep.from` is always set to a node that was already enqueued earlier in the same deps array (Morpho Blue is pushed before market deps), so `depthByAddress` already has its depth:
```typescript
const fromDepth = dep.from
    ? (depthByAddress.get(dep.from.toLowerCase()) ?? depth)
    : depth;
depthByAddress.set(depKey, fromDepth + 1);
queue.push({ address: dep.to, depth: fromDepth + 1 });
```

This ensures oracle/IRM/collateral are at depth 2 (vault→morphoBlue→oracle) and are only explored when `maxDepth ≥ 3`.

### 3. `morpho.adapter.ts`

**`pushIfAddress` helper** — add optional `from` param:
```typescript
function pushIfAddress(out: AdapterDependency[], value: unknown, type: string, from?: string): void {
    if (typeof value !== 'string') return;
    if (!/^0x[0-9a-fA-F]{40}$/.test(value)) return;
    if (value.toLowerCase() === ZERO_ADDRESS) return;
    out.push({ to: value, type, ...(from !== undefined ? { from } : {}) });
}
```

**Batch 3 loop** — pass `morphoBlueAddress` as `from` for all market-level deps:
```typescript
for (const result of marketParamResults) {
    if (result.status !== 'success') continue;
    const [loanToken, collateralToken, oracle, irm] = result.result as MarketParams;
    pushIfAddress(dependencies, collateralToken, 'collateralToken',     morphoBlueAddress);
    pushIfAddress(dependencies, loanToken,       'loanToken',           morphoBlueAddress);
    pushIfAddress(dependencies, oracle,          'oracle',              morphoBlueAddress);
    pushIfAddress(dependencies, irm,             'interestRateModel',   morphoBlueAddress);
}
```

**`dedupeByAddress` key** — change from `dep.to` alone to `(dep.from ?? '') + ':' + dep.to` so that `vault→USDC` (from `asset()`) and `morphoBlue→USDC` (from market params) survive as distinct edges:
```typescript
function dedupeByAddress(deps: AdapterDependency[]): AdapterDependency[] {
    const seen = new Set<string>();
    const out: AdapterDependency[] = [];
    for (const dep of deps) {
        const key = `${dep.from ?? ''}:${dep.to.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(dep);
    }
    return out;
}
```

## Depth Invariant

Morpho Blue is pushed into `dependencies` at index 1 (after `asset`, before `curator`). The BFS loop processes deps in order, so `depthByAddress` has Morpho Blue's depth recorded before the loop reaches any market-level dep that references it as `from`. No ordering guarantee is needed beyond "Morpho Blue before market deps" — which is already the case in the existing adapter.

## Error Handling

No change to error handling. If `dep.from` references an address not yet in `depthByAddress` (e.g. the base multicall failed and Morpho Blue was never pushed), the fallback `?? depth` keeps the existing behaviour.

## Files Changed

| File | Change |
|---|---|
| `backend/src/services/adapters/types.ts` | add `from?: string` to `AdapterDependency` |
| `backend/src/services/graph.service.ts` | use `dep.from` for edge origin and depth |
| `backend/src/services/adapters/morpho.adapter.ts` | pass `from` in batch 3, update `pushIfAddress` and `dedupeByAddress` |