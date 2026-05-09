import { HUGGINGFACE_API_KEY } from '../config/config';
import type { GraphResponse } from '@risk-terminal/shared';

interface HuggingFaceRequest {
    inputs: string;
    parameters?: {
        max_new_tokens?: number;
        temperature?: number;
        top_p?: number;
        return_full_text?: boolean;
    };
}

interface HuggingFaceResponse {
    generated_text?: string;
}

/**
 * Generate a protocol summary using Hugging Face Inference API (Free!)
 * @param graphData - The graph analysis data
 * @returns A brief protocol summary
 */
export async function generateProtocolSummary(graphData: GraphResponse): Promise<string> {
    // If no API key, generate a simple summary from the data
    if (!HUGGINGFACE_API_KEY) {
        return generateFallbackSummary(graphData);
    }

    try {
        // Prepare context from graph data
        const nodeTypes = [...new Set(graphData.nodes.map(n => n.type))];
        const categories = [...new Set(graphData.nodes.map(n => n.category).filter(Boolean))];
        const totalNodes = graphData.nodes.length;
        const totalEdges = graphData.edges.length;
        const riskScore = graphData.graphRiskScore;
        
        // Get top risk flags
        const allRiskFlags = graphData.nodes.flatMap(n => n.riskFlags);
        const riskFlagCounts = allRiskFlags.reduce((acc, flag) => {
            acc[flag] = (acc[flag] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const topRiskFlags = Object.entries(riskFlagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([flag]) => flag);

        // Calculate total TVL
        const totalTVL = graphData.nodes
            .filter(n => n.tvlUsd !== null)
            .reduce((sum, n) => sum + (n.tvlUsd || 0), 0);

        const prompt = `You are a DeFi protocol analyst. Analyze this smart contract system and provide a comprehensive technical description in 1-2 long, detailed sentences (similar to a technical specification).

Protocol Analysis Data:
- Contract types: ${nodeTypes.join(', ')}
- Protocol components: ${categories.join(', ')}
- Risk level: ${riskScore > 70 ? 'High' : riskScore > 40 ? 'Medium' : 'Low'} (${riskScore}/100)
${totalTVL > 0 ? `- Total Value Locked: $${totalTVL.toLocaleString()}` : ''}
${topRiskFlags.length > 0 ? `- Key risk factors: ${topRiskFlags.join(', ')}` : ''}

Your description must include:
1. What the protocol is (vault, lending market, DEX, etc.) and its specific name/purpose
2. The underlying architecture and standards used (ERC-4626, Morpho, Compound, etc.)
3. How it works - what it accepts, where it deploys capital, how it generates yield
4. Key integrations and dependencies (oracles, interest rate models, collateral markets, etc.)
5. Main risk vectors (smart contract risks, admin controls, liquidations, oracle dependencies, etc.)

Write in a technical, precise style with specific protocol names and mechanisms. Use semicolons to separate major points within the sentence. Be comprehensive but concise.

Example style: "Контракт 0x... — это DeFi-vault [Name] на базе [Protocol], который принимает депозиты в [Token] и автоматически распределяет ликвидность по [markets] для генерации доходности; управление рисками курирует [Entity], сам vault использует [Standard] архитектуру и взаимодействует с [Dependencies], а основные риски связаны с [Risk Factors]."

Technical Description:`;

        const requestBody: HuggingFaceRequest = {
            inputs: prompt,
            parameters: {
                max_new_tokens: 400,
                temperature: 0.6,
                top_p: 0.9,
                return_full_text: false
            }
        };

        // Using Mistral-7B-Instruct - fast and good for technical summaries
        const response = await fetch(
            'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`
                },
                body: JSON.stringify(requestBody)
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Hugging Face API error:', response.status, errorText);
            return generateFallbackSummary(graphData);
        }

        const data = await response.json();
        
        // Handle different response formats
        let summary = '';
        if (Array.isArray(data) && data.length > 0) {
            summary = data[0].generated_text?.trim() || '';
        } else if (data.generated_text) {
            summary = data.generated_text.trim();
        }

        // Clean up the summary
        if (summary) {
            // Remove the prompt if it's included
            summary = summary.replace(prompt, '').trim();
            // Take first 2-3 long sentences (they can be very detailed)
            const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 0);
            summary = sentences.slice(0, 3).join('. ') + '.';
        }

        return summary || generateFallbackSummary(graphData);
    } catch (error) {
        console.error('Error generating protocol summary:', error);
        return generateFallbackSummary(graphData);
    }
}

/**
 * Generate a detailed technical summary without AI when API is not available
 */
function generateFallbackSummary(graphData: GraphResponse): string {
    const riskScore = graphData.graphRiskScore;
    
    const categories = [...new Set(graphData.nodes.map(n => n.category).filter(Boolean))];
    const nodeTypes = [...new Set(graphData.nodes.map(n => n.type))];
    
    // Get top risk flags
    const allRiskFlags = graphData.nodes.flatMap(n => n.riskFlags);
    const riskFlagCounts = allRiskFlags.reduce((acc, flag) => {
        acc[flag] = (acc[flag] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const topRiskFlags = Object.entries(riskFlagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([flag]) => flag);

    const totalTVL = graphData.nodes
        .filter(n => n.tvlUsd !== null)
        .reduce((sum, n) => sum + (n.tvlUsd || 0), 0);

    // Determine protocol type and architecture
    let protocolDescription = 'This is a DeFi protocol';
    let architecture = '';
    let functionality = '';
    
    if (categories.includes('Vault')) {
        protocolDescription = 'This is a DeFi vault protocol';
        architecture = 'utilizing vault architecture';
        functionality = 'that accepts deposits and automatically allocates capital across various markets to generate yield';
    } else if (categories.includes('Market')) {
        protocolDescription = 'This is a lending/borrowing protocol';
        architecture = 'built on market-based architecture';
        functionality = 'that facilitates lending and borrowing operations with dynamic interest rates';
    } else if (categories.includes('Token')) {
        protocolDescription = 'This is a token-based protocol';
        architecture = 'implementing token standards';
        functionality = 'that manages token operations and transfers';
    } else if (categories.includes('Multisig')) {
        protocolDescription = 'This is a governance-controlled protocol';
        architecture = 'with multisig governance';
        functionality = 'that requires multiple signatures for critical operations';
    }

    // Build integrations description
    let integrations = '';
    const integrationType = [];
    if (nodeTypes.includes('oracle') || nodeTypes.includes('chainlink-oracle')) {
        integrationType.push('oracle systems');
    }
    if (nodeTypes.includes('erc20') || nodeTypes.includes('loanToken')) {
        integrationType.push('token contracts');
    }
    if (nodeTypes.includes('morpho-market') || nodeTypes.includes('morpho-vault')) {
        integrationType.push('Morpho protocol');
    }
    
    if (integrationType.length > 0) {
        integrations = ` and integrates with ${integrationType.join(', ')}`;
    }

    // Build risk description
    let riskDescription = '';
    if (topRiskFlags.length > 0) {
        riskDescription = `, with primary risks related to ${topRiskFlags.join(', ')}`;
    }

    // Construct the summary
    let summary = `${protocolDescription} ${architecture} ${functionality}${integrations}`;
    
    if (totalTVL > 0) {
        summary += `, managing approximately $${(totalTVL / 1000000).toFixed(1)}M in total value locked`;
    }
    
    summary += `${riskDescription}.`;
    
    return summary;
}
