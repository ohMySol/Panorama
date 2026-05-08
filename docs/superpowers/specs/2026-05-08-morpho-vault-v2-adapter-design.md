# Morpho Vault V2 Adapter

**Date:** 2026-05-08

## Problem

`0xE571B648569619566CF6ce1060C97B621CB635D3` (VaultV2) returns only the root node with no edges. The router's Morpho signature rule checks for `MORPHO` and `supplyQueue` — both absent in V2 — so the contract falls through to the `erc20` adapter, which is a no-op leaf node.

## Root Cause

Morpho Vault V2 uses a different capital-allocation model than MetaMorpho V1:

| | V1 (MetaMorpho) | V2 (VaultV2) |
|---|---|---|
| Capital routing | `supplyQueue` → Morpho Blue market IDs | `adapters[]` → pluggable adapter contracts |
| Protocol ref | `MORPHO()` singleton | no direct singleton reference |
| Market discovery | `supplyQueueLength` + `supplyQueue(i)` + `MORPHO.idToMarketParams(id)` | `adaptersLength()` + `adapters(i)` |

## Approach

**Option A — new `morphoV2` adapter kind** (selected). Additive: V1 logic is untouched, follows the exact pattern already established, each adapter is small and independently testable.

## Architecture

### 1. Router (`router.service.ts`)

Add `'morphoV2'` to `AdapterKind`. Insert a new signature rule **before** the `erc20` rule using three V2-unique function names not present on MetaMorpho V1:

```ts
{ kind: 'morphoV2', requiredFunctions: ['asset', 'adaptersLength', 'adapterRegistry'] }
```

Order in `SIGNATURE_REGISTRY` must be: `morpho` → `morphoV2` → `erc20`.

### 2. New adapter (`morpho-vault-v2.adapter.ts`)

Two multicall batches:

**Batch 1** — single round-trip for scalar getters:
- `asset()` → underlying token address
- `adapterRegistry()` → registry contract
- `liquidityAdapter()` → idle-liquidity adapter
- `curator()` → curator address
- `owner()` → owner address
- `adaptersLength()` → number of active adapters

**Batch 2** — `adapters(0..N-1)` for up to `MAX_ADAPTERS_PER_VAULT = 5` entries.

**Dependencies returned (edge types):**

| Source call | Edge type |
|---|---|
| `asset()` | `'loanToken'` |
| `adapterRegistry()` | `'adapterRegistry'` |
| `liquidityAdapter()` | `'liquidityAdapter'` |
| `curator()` | `'curator'` |
| `owner()` | `'owner'` |
| `adapters(i)` | `'protocolAdapter'` |

All addresses are validated (non-zero, valid hex) before inclusion — same `pushIfAddress` pattern as the V1 adapter. Output is deduplicated by address.

The adapter does **not** look inside the adapter contracts. BFS in `graph.service.ts` resolves each returned address independently in subsequent iterations.

### 3. Registry (`adapters/index.ts`)

Add `morphoV2: morphoVaultV2Adapter` to `ADAPTER_REGISTRY` and extend `AdapterKind`.

## Data Flow

```
VaultV2 address
  → resolveContract()         # Etherscan tier, ABI fetched
  → selectAdapter(abi)        # sees 'adaptersLength' + 'adapterRegistry' → 'morphoV2'
  → morphoVaultV2Adapter()    # 2-batch multicall
      → [asset, adapterRegistry, liquidityAdapter, curator, owner, adapters[0..4]]
  → graph.service BFS enqueues each dependency address
  → each adapter address resolved in next BFS iteration
```

## Error Handling

- If `adaptersLength` call fails, default to 0 (no adapters enumerated — same pattern as V1 market count fallback).
- If batch 2 individual `adapters(i)` calls fail (partial multicall), skip that index.
- Adapter-level errors are caught by the `try/catch` in `graph.service.ts` and logged as warnings — no 500.

## Testing

- Unit test: mock multicall to return known addresses, assert correct `AdapterDependency[]` shape and edge types.
- Unit test: zero-address filtering — zero addresses must not appear in output.
- Unit test: deduplication — if `liquidityAdapter` equals `adapters(0)`, output contains it once.
- Integration smoke: POST `/api/graph` with `0xE571B648569619566CF6ce1060C97B621CB635D3` must return `nodes.length > 1` and `edges.length > 0`.

## Files Changed

| File | Change |
|---|---|
| `backend/src/services/router.service.ts` | add `'morphoV2'` to `AdapterKind`, add signature rule |
| `backend/src/services/adapters/morpho-vault-v2.adapter.ts` | new file |
| `backend/src/services/adapters/index.ts` | register `morphoV2` |
