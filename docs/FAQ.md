# ❓ Frequently Asked Questions

## General Questions

### What is Panorama?
Panorama is a smart contract dependency analyzer that visualizes the complete dependency graph of Ethereum contracts and assigns risk scores to each contract in the chain.

### How does Panorama work?
Panorama analyzes a contract's bytecode and ABI to identify all external contract calls and dependencies. It then recursively analyzes each dependency to build a complete graph, assigning risk scores based on various security factors.

### Which blockchains are supported?
Currently, Panorama supports Ethereum mainnet. Support for other EVM-compatible chains (Polygon, Arbitrum, Optimism, etc.) is planned.

### Is Panorama free to use?
Yes, Panorama is open-source and free to use.

## Technical Questions

### How are risk scores calculated?
Risk scores are calculated based on multiple factors including:
- Contract upgradeability
- Role-based access control (RBAC)
- Presence of timelocks
- Source code verification status
- Contract tier classification
- Known security patterns

### What does "No dependencies found" mean?
This means the contract has no external dependencies or the contract doesn't make calls to other contracts. This could indicate:
- A simple token contract
- A standalone contract
- A contract that only uses internal functions

### Why can't I analyze some contracts?
Some contracts may fail analysis due to:
- Invalid or non-existent contract address
- Unverified contract source code
- Network issues with external APIs
- Rate limiting from data providers

### How deep does the analysis go?
By default, Panorama analyzes up to 3 levels deep in the dependency graph. This can be configured but deeper analysis takes longer.

## Usage Questions

### How do I use Panorama?
1. Enter an Ethereum contract address
2. Click "Analyze" or press Enter
3. View the interactive dependency graph
4. Click on nodes to see detailed information

### Can I analyze multiple contracts at once?
Currently, you can analyze one contract at a time. After analyzing one, you can enter a new address in the header to analyze another.

### Can I export the analysis results?
Export functionality is planned for a future release. Currently, you can take screenshots of the graph.

### How do I interpret the risk scores?
- **0-39** (Green): Low risk - well-audited, verified contracts
- **40-59** (Yellow): Medium risk - some concerns present
- **60-79** (Orange): High risk - multiple risk factors
- **80-100** (Red): Critical risk - significant security concerns

## Development Questions

### How do I run Panorama locally?
See the [Quick Start](../README.md#-quick-start) section in the main README.

### Can I contribute to Panorama?
Yes! Contributions are welcome. Please check the repository for contribution guidelines.

### How do I report a bug?
Please open an issue on the GitHub repository with:
- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

### Is there an API I can use?
Yes, Panorama has a REST API. See the [API Documentation](../README.md#-api-documentation) section.

## Data & Privacy

### What data does Panorama collect?
Panorama only analyzes publicly available blockchain data. No personal information is collected.

### Where does the data come from?
Data is sourced from:
- Ethereum blockchain (via RPC)
- Etherscan API (contract verification)
- Sourcify API (decentralized verification)
- DeFiLlama API (TVL data)

### Is my analysis data stored?
Analysis results are cached temporarily for performance but are not permanently stored or shared.

## Troubleshooting

### The graph is not loading
Try:
- Refreshing the page
- Checking your internet connection
- Verifying the contract address is correct
- Checking if the backend is running (http://localhost:5000)

### The analysis is taking too long
Large dependency graphs can take time to analyze. If it takes more than 30 seconds:
- Check the backend logs for errors
- Try a contract with fewer dependencies
- Reduce the analysis depth

### I see "Error: Failed to analyze contract"
This could mean:
- The contract address is invalid
- The contract is not verified
- External APIs are rate limiting
- Network connectivity issues

Check the error message for more specific information.

## Contact & Support

### How do I get help?
- Check this FAQ
- Read the documentation
- Open an issue on GitHub
- Check existing issues for similar problems

### How do I request a feature?
Open a feature request issue on GitHub with:
- Clear description of the feature
- Use case and benefits
- Any relevant examples or mockups
