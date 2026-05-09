# 📋 Panorama Project Summary

## Overview

**Panorama** is a smart contract dependency analyzer and risk assessment tool for Ethereum. It provides visual insights into contract dependencies and quantifies security risks across the entire dependency chain.

## Key Capabilities

### 1. Dependency Analysis
- Automatically discovers all contract dependencies
- Recursively analyzes the entire dependency tree
- Identifies external calls and contract interactions
- Maps protocol relationships

### 2. Risk Assessment
- Assigns 0-100 risk scores to each contract
- Evaluates multiple security factors
- Provides graph-level risk overview
- Highlights specific risk flags

### 3. Visualization
- Interactive dependency graph
- Hierarchical tree view
- Color-coded risk indicators
- Draggable and zoomable interface

### 4. Detailed Insights
- Contract metadata and verification status
- TVL (Total Value Locked) data
- Source code availability
- Etherscan integration

## Technology Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **UI Library**: React 19
- **Styling**: TailwindCSS 4
- **Data Fetching**: TanStack Query v5
- **Language**: TypeScript 5

### Backend
- **Framework**: Express.js
- **Blockchain**: Viem (Ethereum library)
- **Language**: TypeScript 6
- **APIs**: Etherscan, Sourcify, DeFiLlama

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Development**: Hot reload for both frontend and backend
- **Production**: Multi-stage builds for optimization

## Project Structure

```
panorama/
├── frontend/              # Next.js application
│   ├── app/              # Pages and layouts
│   │   ├── dashboard/    # Dashboard with [address] route
│   │   └── src/          # Components
│   ├── lib/              # Utilities and hooks
│   │   ├── api/          # API client
│   │   ├── config/       # Configuration
│   │   ├── context/      # React contexts
│   │   ├── hooks/        # Custom hooks
│   │   └── validation/   # Input validation
│   └── public/           # Static assets
│
├── backend/              # Express API
│   └── src/
│       ├── clients/      # External API clients
│       │   ├── etherscan.client.ts
│       │   ├── sourcify.client.ts
│       │   ├── defillama.client.ts
│       │   └── rpc.client.ts
│       ├── services/     # Business logic
│       │   ├── graph.service.ts
│       │   ├── resolver.service.ts
│       │   └── scorer.service.ts
│       ├── routes/       # API routes
│       └── middleware/   # Express middleware
│
├── packages/
│   └── shared/           # Shared TypeScript types
│       └── src/
│           └── types.ts  # Common interfaces
│
└── docs/                 # Documentation
    ├── FEATURES.md
    ├── FAQ.md
    ├── ADD_SCREENSHOTS.md
    └── screenshots/
```

## Key Features Implementation

### 1. Dynamic Routing
- `/dashboard/[address]` - Dynamic route for contract analysis
- Address validation and redirect logic
- URL-based state management

### 2. Real-time Data Fetching
- TanStack Query for caching and state management
- Automatic refetching and cache invalidation
- Loading and error states

### 3. Interactive Graph
- SVG-based rendering for performance
- Zoom, pan, and drag functionality
- Node selection and highlighting
- Edge relationship visualization

### 4. Risk Scoring Algorithm
- Multi-factor risk assessment
- Weighted scoring system
- Configurable risk thresholds
- Visual risk indicators

### 5. Dependency Tree
- Recursive tree building
- Cycle detection
- Expandable/collapsible nodes
- Parent-child relationship tracking

## API Endpoints

### POST `/api/graph/build`
Analyzes a contract and builds dependency graph

**Request:**
```json
{
  "address": "0x...",
  "chain_id": 1,
  "depth": 3
}
```

**Response:**
```json
{
  "root": "0x...",
  "nodes": [
    {
      "address": "0x...",
      "name": "ContractName",
      "type": "token",
      "riskScore": 45,
      "riskFlags": ["upgradeable"],
      "tier": 2,
      "sourceAvailable": true,
      "tvlUsd": 1000000
    }
  ],
  "edges": [
    {
      "from": "0x...",
      "to": "0x...",
      "type": "oracle"
    }
  ],
  "graphRiskScore": 52,
  "summary": "Analysis summary..."
}
```

## Development Workflow

### Local Development
```bash
# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev
```

### Docker Development
```bash
# Start all services
docker-compose up

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment
```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d
```

## Performance Optimizations

### Frontend
- Server-side rendering for initial load
- Client-side caching with TanStack Query
- Code splitting and lazy loading
- Optimized SVG rendering
- RequestAnimationFrame for smooth animations

### Backend
- Response caching
- Rate limiting
- Efficient API calls
- Connection pooling
- Error handling and retries

## Security Considerations

- Input validation on all endpoints
- Rate limiting to prevent abuse
- CORS configuration
- Helmet.js for security headers
- Environment variable management
- No sensitive data in client

## Future Enhancements

### Short-term
- Multi-chain support (Polygon, Arbitrum, Optimism)
- Export functionality (PDF, JSON, CSV)
- Historical risk tracking
- Comparison mode

### Long-term
- User accounts and saved analyses
- Custom risk scoring rules
- Audit report generation
- Integration with security tools
- API key management
- Notification system

## Metrics & KPIs

### Performance
- Initial page load: < 2s
- Contract analysis: < 10s (average)
- Graph rendering: < 1s
- API response time: < 500ms

### User Experience
- Mobile responsive
- Accessibility compliant
- Intuitive navigation
- Clear error messages
- Fast feedback loops

## Deployment

### Requirements
- Docker 20.10+
- Docker Compose 2.0+
- Node.js 20+ (for local development)
- 2GB RAM minimum
- 10GB disk space

### Environment Variables
- `NEXT_PUBLIC_API_BASE_URL` - Frontend API URL
- `PORT` - Backend port (default: 5000)
- `ETHERSCAN_API_KEY` - Etherscan API key (optional)

## Support & Resources

- **Documentation**: `/docs` directory
- **Docker Guide**: `DOCKER.md`
- **FAQ**: `docs/FAQ.md`
- **Features**: `docs/FEATURES.md`

## License

ISC License - Open source and free to use

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: Active Development
