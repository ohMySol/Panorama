# Morpho Vault V2 Adapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Morpho Vault V2 contracts return a full dependency graph instead of just the root node.

**Architecture:** Add a `morphoV2` adapter kind that identifies V2 vaults via their unique `adaptersLength` + `adapterRegistry` ABI fingerprint, reads the vault's scalar getters and adapter array in two multicall batches, and returns them as `AdapterDependency[]` for BFS to resolve. The adapter file is created first so that extending `AdapterKind` in the router never leaves the TypeScript build in a broken state.

**Tech Stack:** TypeScript, viem (`multicall`, `Abi`)

---

### Task 1: Create `morpho-vault-v2.adapter.ts`

**Files:**
- Create: `backend/src/services/adapters/morpho-vault-v2.adapter.ts`

- [ ] **Step 1: Create the adapter file**

```typescript
import type { Abi } from 'viem';
import { multicall } from '../../clients/rpc.client';
import type { Adapter, AdapterDependency } from './types';

const MAX_ADAPTERS_PER_VAULT = 5;

const VAULT_V2_ABI = [
    { type: 'function', name: 'asset', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
    { type: 'function', name: 'adapterRegistry', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
    { type: 'function', name: 'liquidityAdapter', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
    { type: 'function', name: 'curator', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
    { type: 'function', name: 'owner', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
    { type: 'function', name: 'adaptersLength', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
    { type: 'function', name: 'adapters', inputs: [{ type: 'uint256' }], outputs: [{ type: 'address' }], stateMutability: 'view' },
] as const satisfies Abi;

export const morphoVaultV2Adapter: Adapter = async (address, _abi, chainId) => {
    const baseCalls = [
        { address, abi: VAULT_V2_ABI, functionName: 'asset' },
        { address, abi: VAULT_V2_ABI, functionName: 'adapterRegistry' },
        { address, abi: VAULT_V2_ABI, functionName: 'liquidityAdapter' },
        { address, abi: VAULT_V2_ABI, functionName: 'curator' },
        { address, abi: VAULT_V2_ABI, functionName: 'owner' },
        { address, abi: VAULT_V2_ABI, functionName: 'adaptersLength' },
    ];
    const baseResults = await multicall(baseCalls, chainId);
    const [asset, adapterRegistry, liquidityAdapter, curator, owner, adaptersLength] =
        baseResults.map(unwrapResult);

    const dependencies: AdapterDependency[] = [];
    pushIfAddress(dependencies, asset, 'loanToken');
    pushIfAddress(dependencies, adapterRegistry, 'adapterRegistry');
    pushIfAddress(dependencies, liquidityAdapter, 'liquidityAdapter');
    pushIfAddress(dependencies, curator, 'curator');
    pushIfAddress(dependencies, owner, 'owner');

    const adapterCount = typeof adaptersLength === 'bigint'
        ? Math.min(Number(adaptersLength), MAX_ADAPTERS_PER_VAULT)
        : 0;

    if (adapterCount === 0) return dependencies;

    const adapterCalls = Array.from({ length: adapterCount }, (_, i) => ({
        address,
        abi: VAULT_V2_ABI,
        functionName: 'adapters',
        args: [BigInt(i)] as const,
    }));
    const adapterResults = await multicall(adapterCalls, chainId);
    for (const r of adapterResults) {
        if (r.status === 'success') pushIfAddress(dependencies, r.result, 'protocolAdapter');
    }

    return dedupeByAddress(dependencies);
};

/* ==================== helpers ==================== */

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

function unwrapResult(
    r: { status: 'success'; result: unknown } | { status: 'failure'; error: Error },
): unknown {
    return r.status === 'success' ? r.result : null;
}

function pushIfAddress(out: AdapterDependency[], value: unknown, type: string): void {
    if (typeof value !== 'string') return;
    if (!/^0x[0-9a-fA-F]{40}$/.test(value)) return;
    if (value.toLowerCase() === ZERO_ADDRESS) return;
    out.push({ to: value, type });
}

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

- [ ] **Step 2: Commit**

```bash
git add backend/src/services/adapters/morpho-vault-v2.adapter.ts
git commit -m "feat: add morpho vault v2 adapter"
```

---

### Task 2: Wire up the adapter (router + registry)

Both files must change in the same commit — adding `'morphoV2'` to `AdapterKind` without registering it breaks the `Record<AdapterKind, Adapter>` exhaustiveness check.

**Files:**
- Modify: `backend/src/services/router.service.ts`
- Modify: `backend/src/services/adapters/index.ts`

- [ ] **Step 1: Extend `AdapterKind` and add the signature rule in `router.service.ts`**

Change line 7:
```typescript
export type AdapterKind = 'morpho' | 'morphoV2' | 'erc20' | 'fallback';
```

Change `SIGNATURE_REGISTRY` (lines 24–27) to:
```typescript
const SIGNATURE_REGISTRY: readonly SignatureRule[] = [
    { kind: 'morpho', requiredFunctions: ['asset', 'MORPHO', 'supplyQueue'] },
    { kind: 'morphoV2', requiredFunctions: ['asset', 'adaptersLength', 'adapterRegistry'] },
    { kind: 'erc20', requiredFunctions: ['transfer', 'balanceOf', 'totalSupply'] },
];
```

- [ ] **Step 2: Register the adapter in `adapters/index.ts`**

Add the import after the existing morpho import:
```typescript
import { morphoVaultV2Adapter } from './morpho-vault-v2.adapter';
```

Add the entry to `ADAPTER_REGISTRY`:
```typescript
const ADAPTER_REGISTRY: Record<AdapterKind, Adapter> = {
    morpho: morphoAdapter,
    morphoV2: morphoVaultV2Adapter,
    erc20: erc20Adapter,
    fallback: fallbackAdapter,
};
```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

Run from `backend/`:
```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/router.service.ts backend/src/services/adapters/index.ts
git commit -m "feat: route morpho vault v2 contracts to morphoV2 adapter"
```

---

### Task 3: Smoke-test against the live vault

- [ ] **Step 1: Call the endpoint**

```bash
curl -s -X POST http://localhost:3000/api/graph \
  -H "Content-Type: application/json" \
  -d '{"address":"0xE571B648569619566CF6ce1060C97B621CB635D3","depth":2,"chain_id":1}' \
  | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('nodes:', len(d['nodes']))
print('edges:', len(d['edges']))
for e in d['edges']: print(' ', e['type'], '->', e['to'])
"
```

Expected: `nodes` > 1, `edges` > 0, edge types include `loanToken`, `adapterRegistry`, `liquidityAdapter`, and/or `protocolAdapter`.
