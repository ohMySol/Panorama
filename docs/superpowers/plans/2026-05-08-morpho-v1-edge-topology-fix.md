# Morpho V1 Edge Topology Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the Morpho V1 adapter so that oracle, IRM, collateralToken, and loanToken discovered from market params are emitted as edges from Morpho Blue — not from the vault.

**Architecture:** Add an optional `from` field to `AdapterDependency`. The graph service uses `dep.from ?? resolved.address` for both the edge origin and the depth anchor. The V1 adapter sets `from: morphoBlueAddress` on all batch-3 market deps. Dedup key is updated to `from:to` so vault→USDC and morphoBlue→USDC survive as distinct edges.

**Tech Stack:** TypeScript, viem

---

### Task 1: Add `from?` to `AdapterDependency` and update `graph.service.ts`

These two changes ship together — the type change is backward-compatible (optional field), and the service change is only meaningful once the type supports it.

**Files:**
- Modify: `backend/src/services/adapters/types.ts`
- Modify: `backend/src/services/graph.service.ts`

- [ ] **Step 1: Add `from?` to `AdapterDependency` in `types.ts`**

Replace lines 10–13 of `backend/src/services/adapters/types.ts`:

```typescript
export interface AdapterDependency {
    to: string;
    type: string;
    from?: string; // overrides edge origin and depth anchor; defaults to resolved.address
}
```

- [ ] **Step 2: Update the BFS loop in `graph.service.ts`**

Replace lines 86–96 of `backend/src/services/graph.service.ts`:

```typescript
        for (const dep of dependencies) {
            const edgeFrom = dep.from ?? resolved.address;
            edges.push({ from: edgeFrom, to: dep.to, type: dep.type });

            const depKey = dep.to.toLowerCase();
            if (seen.has(depKey)) continue;
            if (nodesByAddress.size + queue.length >= MAX_GRAPH_NODES) break;

            seen.add(depKey);
            const fromDepth = dep.from
                ? (depthByAddress.get(dep.from.toLowerCase()) ?? depth)
                : depth;
            depthByAddress.set(depKey, fromDepth + 1);
            queue.push({ address: dep.to, depth: fromDepth + 1 });
        }
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/ah/Desktop/Development/Projects/Panorama/backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/adapters/types.ts backend/src/services/graph.service.ts
git commit -m "feat: support per-dep edge origin via AdapterDependency.from"
```

---

### Task 2: Update `morpho-vault-v1.adapter.ts` to use `from`

Three changes in the same file: `pushIfAddress` gains an optional `from` param, `dedupeByAddress` updates its key, and the batch-3 loop passes `morphoBlueAddress` as `from`.

**Files:**
- Modify: `backend/src/services/adapters/morpho-vault-v1.adapter.ts`

- [ ] **Step 1: Update `pushIfAddress` (lines 145–150)**

Replace:
```typescript
function pushIfAddress(out: AdapterDependency[], value: unknown, type: string): void {
    if (typeof value !== 'string') return;
    if (!/^0x[0-9a-fA-F]{40}$/.test(value)) return;
    if (value.toLowerCase() === ZERO_ADDRESS) return;
    out.push({ to: value, type });
}
```

With:
```typescript
function pushIfAddress(out: AdapterDependency[], value: unknown, type: string, from?: string): void {
    if (typeof value !== 'string') return;
    if (!/^0x[0-9a-fA-F]{40}$/.test(value)) return;
    if (value.toLowerCase() === ZERO_ADDRESS) return;
    out.push({ to: value, type, ...(from !== undefined ? { from } : {}) });
}
```

- [ ] **Step 2: Update `dedupeByAddress` (lines 152–161)**

Replace:
```typescript
function dedupeByAddress(deps: AdapterDependency[]): AdapterDependency[] {
    const seen = new Set<string>();
    const out: AdapterDependency[] = [];
    for (const dep of deps) {
        const key = dep.to.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(dep);
    }
    return out;
}
```

With:
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

- [ ] **Step 3: Update batch-3 loop (lines 115–122) to pass `morphoBlueAddress` as `from`**

Replace:
```typescript
    for (const result of marketParamResults) {
        if (result.status !== 'success') continue;
        const [loanToken, collateralToken, oracle, irm] = result.result as MarketParams;
        pushIfAddress(dependencies, collateralToken, 'collateralToken');
        pushIfAddress(dependencies, loanToken, 'loanToken');
        pushIfAddress(dependencies, oracle, 'oracle');
        pushIfAddress(dependencies, irm, 'interestRateModel');
    }
```

With:
```typescript
    for (const result of marketParamResults) {
        if (result.status !== 'success') continue;
        const [loanToken, collateralToken, oracle, irm] = result.result as MarketParams;
        pushIfAddress(dependencies, collateralToken, 'collateralToken',   morphoBlueAddress);
        pushIfAddress(dependencies, loanToken,       'loanToken',         morphoBlueAddress);
        pushIfAddress(dependencies, oracle,          'oracle',            morphoBlueAddress);
        pushIfAddress(dependencies, irm,             'interestRateModel', morphoBlueAddress);
    }
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/ah/Desktop/Development/Projects/Panorama/backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/adapters/morpho-vault-v1.adapter.ts
git commit -m "fix: emit market-level deps from Morpho Blue, not vault"
```

---

### Task 3: Smoke-test edge topology

- [ ] **Step 1: Call the endpoint with a known MetaMorpho V1 vault**

`0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB` is the Steakhouse USDC MetaMorpho V1 vault on mainnet.

```bash
curl -s -X POST http://localhost:3000/api/graph \
  -H "Content-Type: application/json" \
  -d '{"address":"0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB","depth":3,"chain_id":1}' \
  | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('nodes:', len(d['nodes']))
print('edges:', len(d['edges']))
morpho_blue = '0xbbbbbbbb9cc5e90e3b3af64bdaf62c37eeffcb'
vault = '0xbeef01735c132ada46aa9aa4c54623caa92a64cb'
for e in d['edges']:
    origin = 'MORPHO_BLUE' if e['from'].lower() == morpho_blue else 'VAULT' if e['from'].lower() == vault else 'OTHER'
    print(f'  [{origin}] {e[\"type\"]} -> {e[\"to\"][:10]}...')
"
```

Expected:
- `oracle`, `interestRateModel`, `collateralToken` edges must show `[MORPHO_BLUE]` as origin
- `loanToken` (from vault's `asset()`), `protocolCore`, `curator`, `guardian`, `owner` edges show `[VAULT]`
- The same token address can appear twice: once as `[VAULT] loanToken` (vault's asset) and once as `[MORPHO_BLUE] loanToken` (market param)
