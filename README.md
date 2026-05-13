<p align="center">
  <img src="frontend/public/argus-logo.png" alt="Panorama Logo" width="80" height="80">
</p>

<h1 align="center">Panorama</h1>

<p align="center">
  <strong>Map every dependency.</strong>
</p>

<p align="center">
Panorama is a smart contract dependency analyzer that visualizes the entire dependency graph of Ethereum contracts.
</p>

![Panorama Home Page](img/home_page.jpg)

## 🎯 What is Panorama?

Panorama is a smart contract dependency analyzer that visualizes the entire dependency graph in a way that you can clearly see what your vault or pool or strategy depends on. Every node in the graph is a standalone smart contract which plays a specific role (e.g.: multisig owner, oracle, lending market, ...) inside your root contract. The nodes have basic information like number of signers, found risk flags (e.g: upgradeable proxy) which will be useful during the research and analysis. 

## ✨ Features 

- 🔗 **Dependency Graph Visualization** - Interactive hierarchical graph showing all contract dependencies
- 🌳 **Dependency Tree View** - Hierarchical tree structure showing parent-child relationships
- 🔍 **Detailed Metadata** - Contract tier, source availability
- 🎯 **Interactive Nodes** - Click any node to view detailed information
- 🖱️ **Draggable Graph** - Move nodes around to customize your view
- 🤖 **AI Protocol Summaries** - Automatic protocol analysis when no node is selected

![Panorama Dashboard](img/dashboard.jpg)

## 🏗️ Architecture

### Workflow
![Workflow](img/workflow.jpg)


### Project Structure

```
Panorama/
├── backend/                              # Express + TypeScript API
│   ├── src/
│   │   ├── app.ts                        # Server entry point
│   │   ├── clients/                      # External service clients
│   │   │   ├── etherscan.client.ts
│   │   │   ├── http.ts
│   │   │   ├── rpc.client.ts
│   │   │   └── sourcify.client.ts
│   │   ├── config/
│   │   │   └── config.ts                 # Env vars, depth limits, constants
│   │   ├── controllers/
│   │   │   ├── ai-summary.controller.ts
│   │   │   └── graph.controller.ts
│   │   ├── middleware/
│   │   │   └── error.middleware.ts
│   │   ├── routes/
│   │   │   ├── ai.router.ts
│   │   │   └── graph.router.ts
│   │   └── services/
│   │       ├── ai-summary.service.ts
│   │       ├── cache.service.ts
│   │       ├── graph.service.ts          # BFS dependency-graph builder
│   │       ├── resolver.service.ts
│   │       ├── router.service.ts
│   │       ├── manifests/                # Protocol manifests + executor
│   │       │   ├── executor.ts
│   │       │   ├── index.ts
│   │       │   ├── types.ts
│   │       │   └── protocols/            # erc20, morpho-*, safe-multisig
│   │       └── risk/                     # Risk-flag detection (universal + per-profile)
│   │           ├── index.ts
│   │           ├── universal.ts
│   │           ├── types.ts
│   │           └── profiles/token.ts
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                             # Next.js (App Router) UI
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                      # Landing page
│   │   ├── providers.tsx
│   │   ├── globals.css
│   │   ├── dashboard/[address]/page.tsx  # Dynamic analysis page
│   │   └── src/components/
│   │       ├── dashboard/                # Graph, node info, metadata, tabs
│   │       ├── lending/                  # Landing hero, scan input, header
│   │       └── shared/                   # Background glow, intro
│   ├── lib/
│   │   ├── api/                          # graph + ai-summary HTTP clients
│   │   ├── config/api.config.ts
│   │   ├── context/selected-node.context.tsx
│   │   ├── hooks/                        # useGraphAnalysis, useAiSummary
│   │   ├── utils/node-display.ts
│   │   └── validation/address.validation.ts
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── packages/
│   └── shared/src/                       # Shared types between FE/BE
│       ├── index.ts
│       └── types.ts
│
├── img/
├── docker-compose.yml
├── Makefile
├── start.sh
└── README.md
```

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TailwindCSS 4** - Utility-first CSS framework
- **TanStack Query** - Powerful data fetching and caching
- **TypeScript** - Type-safe development

### Backend
- **Express** - Fast, minimalist web framework
- **TypeScript** - Type-safe backend development
- **Viem** - Lightweight Ethereum library
- **Etherscan API** - Contract verification and source code
- **Sourcify API** - Decentralized contract verification

### Infrastructure
- **Docker** - Containerized deployment
- **Docker Compose** - Multi-container orchestration
- **Monorepo** - Shared types between frontend and backend

## 🚀 Quick Start

### Environment Variables

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Backend** (`.env`):
```env
SERVER_PORT=5000
ETHERSCAN_API_KEY=your_api_key_here
# Optional: AI-powered protocol summaries (free!)
HUGGINGFACE_API_KEY=your_huggingface_token_here
```

**Get Hugging Face API Key (Free):**
1. Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Create a new token (read access is enough)
3. Copy and paste into `.env` file

### Available Commands

**Docker:**
```bash
make dev       # Start development environment (detached)
make up        # Start containers in foreground
make build     # Rebuild containers
make logs      # View logs
make down      # Stop containers
make restart   # Restart containers
make clean     # Remove all containers and volumes
```

**Development:**
```bash
# Backend
cd backend
npm run dev    # Start dev server

# Frontend
cd frontend
npm run dev    # Start Next.js dev server
```

### Using Docker (Recommended)

```bash
# Start the entire stack
docker compose up

# Or use the convenience script
./start.sh
```

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Manual Setup

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📖 Usage
**Important Note**. Panorama is a prototype project and currently it is working only on Ethereum Mainnet for Morpho Vault V1.

1. **Enter a Contract Address** - Paste an Ethereum contract address into the input field
2. **Analyze** - Click "Analyze" or press Enter to start the analysis
3. **Explore the Graph** - View the interactive dependency graph
4. **Inspect Nodes** - Click on any node to see detailed information
5. **Navigate** - Use zoom controls and drag nodes to customize your view

## 🗂️ Protocol Manifests

Manifests are the mechanism by which Panorama knows how to traverse a specific protocol. Instead of writing a TypeScript code for every protocol, each protocol is described as a **JSON file** that declares which on-chain functions to call, what to do with the results, and what metadata to surface in the UI. A single generic executor reads any manifest and runs the same pipeline.

### How the executor works

When a contract is identified as a known protocol, the executor runs up to three batched RPC rounds:

**Round 1 — direct getters + paginated lengths + metadata**
All single-call getters are batched into one multicall. This includes addresses returned by direct getters (e.g. `owner`, `curator`), the lengths of any lists (e.g. `supplyQueueLength`), and metadata values like token `symbol` or multisig `threshold`.

**Round 2 — paginated items**
For each list discovered in Round 1, the executor fetches every item up to `maxItemsPerSource`. Items are either addresses (emitted as edges directly) or `bytes32` identifiers that need a further lookup.

**Round 3 — cross-contract follow-ups**
When items are `bytes32` IDs (e.g. Morpho market IDs), the executor calls a second contract to unpack them into concrete addresses. For example, Morpho Vault market IDs are resolved against the Morpho Blue core contract via `idToMarketParams`, yielding the loan token, collateral token, oracle, and interest rate model — all in one extra multicall.

**Every function name in a manifest is validated against the contract's resolved ABI before any call is issued**. A function not present in the ABI is silently skipped, so a manifest written for a newer contract version never crashes against an older one.

### Manifest file structure

```jsonc
{
  "id": "morpho",           // AdapterKind — used as GraphNode.type and by risk profiles
  "category": "Vault",      // UI chip label ("Vault", "Market", "Token", "Multisig", …)
  "fingerprint": [          // ALL of these function names must exist in the ABI to match
    "asset", "MORPHO", "supplyQueue"
  ],
  "directCalls": [          // Single getters that return one address each --> one edge each
    { "function": "owner",  "role": "owner"   },
    { "function": "asset",  "role": "loanToken" }
  ],
  "paginatedCalls": [       // Length-prefixed list getters --> one edge per item
    {
      "sources": [
        { "lengthFunction": "supplyQueueLength", "itemFunction": "supplyQueue" }
      ],
      "itemType": "bytes32",        // "address" --> direct edges; "bytes32" --> needs followUp
      "maxItemsPerSource": 5,
      "followUp": {                 // Only needed when itemType is "bytes32"
        "addressFromRole": "protocolCore",   // Role of a directCall whose result is the target
        "function": { ... },                 // Inline ABI of the function to call on that target
        "extract": [                         // Which tuple fields to pull out and with what role
          { "index": 0, "role": "loanToken" },
          { "index": 2, "role": "oracle"    }
        ],
        "anchorFromTarget": true    // Attribute edges to the target contract, not the vault
      }
    }
  ],
  "metadataCalls": [        // Read-only facts surfaced in the UI; never produce edges
    { "function": "symbol",      "field": "symbol"   },
    { "function": "getOwners",   "field": "signerCount", "project": "length" },
    { "function": "getThreshold","field": "signerThreshold" }
  ]
}
```

### Existing manifests

| File | `id` | `category` | Fingerprint |
|---|---|---|---|
| `morpho-vault-v1.json` | `morpho` | Vault | `asset`, `MORPHO`, `supplyQueue` |
| `morpho-vault-v2.json` | `morphoV2` | Vault | `asset`, `MORPHO`, `supplyQueue`, `publicAllocator` |
| `morpho-blue.json` | `morphoBlue` | Market | `idToMarketParams`, `createMarket`, `accrueInterest` |
| `safe-multisig.json` | `safe` | Multisig | `getOwners`, `getThreshold`, `isOwner` |
| `erc20.json` | `erc20` | Token | `transfer`, `balanceOf`, `totalSupply` |

Matching is **first-match-wins** in the order they are registered in `manifests/index.ts`. More specific protocols (Morpho Vault) are listed before broader ones (ERC-20) because a MetaMorpho vault is also ERC-20-compatible.

### Adding a new protocol

**1. Create the JSON manifest** in `backend/src/services/manifests/protocols/`:

```jsonc
// protocols/aave-v3-pool.json
{
  "id": "aaveV3",
  "category": "Lending",
  "fingerprint": ["supply", "borrow", "getReserveData"],
  "directCalls": [
    { "function": "ADDRESSES_PROVIDER", "role": "addressesProvider" }
  ],
  "metadataCalls": [
    { "function": "MAX_NUMBER_RESERVES", "field": "maxReserves" }
  ]
}
```

Choose a `fingerprint` of 2–4 functions that are **unique** to this protocol. Avoid functions present in ERC-20 (`transfer`, `balanceOf`) or other broad interfaces, otherwise the manifest may match unintended contracts.

**2. Register the `id` in `AdapterKind`** (`manifests/types.ts`):

```ts
export type AdapterKind =
  | 'morphoBlue' | 'morpho' | 'morphoV2'
  | 'erc20' | 'safe'
  | 'aaveV3'       // add your new id here
  | 'fallback';
```

**3. Import and register the manifest** in `manifests/index.ts`:

```ts
import aaveV3Pool from './protocols/aave-v3-pool.json';

const MANIFESTS: readonly ProtocolManifest[] = [
  morphoV1 as ProtocolManifest,
  morphoV2 as ProtocolManifest,
  morphoBlue as ProtocolManifest,
  aaveV3Pool as ProtocolManifest,   // add before erc20/safe to avoid false-positive matches
  safeMultisig as ProtocolManifest,
  erc20 as ProtocolManifest,
];
```

**4. Optionally add a risk profile** in `risk/profiles/` if this protocol has token-level or protocol-specific risk signals worth flagging (e.g. pausing mechanisms, admin key patterns). Register it in `risk/index.ts` under `PROFILE_REGISTRY`.

That is everything needed — no changes to the graph builder, executor, resolver, or frontend. The manifest is picked up automatically the next time a contract with the matching fingerprint is resolved.

### Limitations

- **Requires a verified contract.** Fingerprint matching runs against the resolved ABI. If a contract has no source on Sourcify or Etherscan, the ABI is `null`, no manifest can match, and the node becomes a leaf with no discovered dependencies. Unverified contracts are invisible to the manifest system.

- **Fingerprints are heuristics, not guarantees.** Two different protocols can expose the same set of function names. A wrong match silently produces incorrect edges. The safest fingerprints are 3–4 functions that are unique to a protocol's interface, but there is no enforcement - a bad fingerprint will not error, it will just graph the wrong thing.

- **No conditional logic.** Manifests are declarative JSON. If a protocol's dependency structure is conditional (e.g. "call `X` only if flag `Y` is set"), that cannot be expressed. The executor always runs all declared calls. Protocols with dynamic or branching dependency graphs need a custom TypeScript adapter instead.

- **Only view calls, no event logs.** The executor only issues `eth_call` reads. Dependencies discovered via emitted events — common in factory patterns where child contracts are created on-chain — are completely invisible. A protocol that registers markets through events rather than exposing them via a length/item getter cannot be covered by a manifest.

- **`followUp` ABI is inlined and static.** The ABI fragment for a cross-contract lookup must be written directly into the manifest JSON. If the target contract is upgraded and the function signature changes, the manifest silently starts returning nothing rather than erroring. There is no version pinning or ABI re-resolution.

## 📚 API Documentation

### Endpoints

**POST** `/api/graph`
```json
{
  "address": "0xfff",
  "chain_id": 1,
  "depth": 3
}
```
- `address` - address of the contract you want to build graph for
- `chain_id` - ID of the chain where the contract lives
- `depth` - controls how many levels deep the BFS traversal expands the dependency graph from the root contract (e.g: depth = 3. This means 3 steps out from the root).

**Response:**
```json
{
  "root": "0x...",
  "nodes": [...],
  "edges": [...],
  "graphRiskScore": 0,
  "summary": null
}
```
- `root` - the root contract address
- `nodes` - node objects describing each dependency found inside the root contract
- `edges` - edge objects describing the relationship between nodes (e.g. `node1 --> node2` means `node2` was found inside `node1`)
- `graphRiskScore` - aggregate risk score (currently always `0` — scoring engine is disabled)
- `summary` - always `null` here; the AI summary is fetched separately via `POST /api/ai/summary`

**POST** `/api/ai/summary`

Body: the full `GraphResponse` object returned by `/api/graph`.

**Response:**
```json
{
  "summary": "..."
}
```
- `summary` - one or two sentences of AI-generated protocol description. Uses Hugging Face Inference if `HUGGINGFACE_API_KEY` is set, otherwise falls back to a deterministic template built from the graph data.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Built with ❤️ for the Ethereum ecosystem**