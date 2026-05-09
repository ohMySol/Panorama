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

        const prompt = `You are a DeFi security analyst. Analyze this protocol and provide a detailed technical summary (4-6 sentences).

Protocol Data:
- Contracts: ${totalNodes}
- Dependencies: ${totalEdges}
- Risk Score: ${riskScore}/100
- Types: ${nodeTypes.join(', ')}
- Categories: ${categories.join(', ')}
${totalTVL > 0 ? `- TVL: $${totalTVL.toLocaleString()}` : ''}
${topRiskFlags.length > 0 ? `- Risks: ${topRiskFlags.join(', ')}` : ''}

Provide a comprehensive summary covering: 1) Protocol architecture and main components, 2) Key dependencies and their roles, 3) Risk assessment and security concerns, 4) Overall complexity and design patterns.

Summary:`;

        const requestBody: HuggingFaceRequest = {
            inputs: prompt,
            parameters: {
                max_new_tokens: 300,
                temperature: 0.7,
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
            // Take first 4-6 sentences
            const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 0);
            summary = sentences.slice(0, 6).join('. ') + '.';
        }

        return summary || generateFallbackSummary(graphData);
    } catch (error) {
        console.error('Error generating protocol summary:', error);
        return generateFallbackSummary(graphData);
    }
}

/**
 * Generate a simple summary without AI when API is not available
 */
function generateFallbackSummary(graphData: GraphResponse): string {
    const totalNodes = graphData.nodes.length;
    const totalEdges = graphData.edges.length;
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
        .slice(0, 5)
        .map(([flag, count]) => `${flag} (${count})`);

    const totalTVL = graphData.nodes
        .filter(n => n.tvlUsd !== null)
        .reduce((sum, n) => sum + (n.tvlUsd || 0), 0);

    // Count nodes by tier
    const tierCounts = graphData.nodes.reduce((acc, n) => {
        acc[n.tier] = (acc[n.tier] || 0) + 1;
        return acc;
    }, {} as Record<number, number>);

    let summary = `This protocol consists of ${totalNodes} contract${totalNodes > 1 ? 's' : ''} with ${totalEdges} dependenc${totalEdges === 1 ? 'y' : 'ies'}. `;
    
    if (categories.length > 0) {
        summary += `The system includes ${categories.slice(0, 4).join(', ')} components. `;
    }
    
    // Add tier distribution
    const tierInfo = Object.entries(tierCounts)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([tier, count]) => `Tier ${tier}: ${count}`)
        .join(', ');
    summary += `Contract distribution: ${tierInfo}. `;
    
    // Add risk assessment
    summary += `Overall risk score: ${riskScore}/100. `;
    
    if (topRiskFlags.length > 0) {
        summary += `Key security concerns: ${topRiskFlags.join(', ')}. `;
    }
    
    if (totalTVL > 0) {
        summary += `Total value locked: $${totalTVL.toLocaleString()}. `;
    }

    // Add complexity assessment
    const avgDependencies = totalEdges / totalNodes;
    if (avgDependencies > 3) {
        summary += `High complexity with an average of ${avgDependencies.toFixed(1)} dependencies per contract.`;
    } else if (avgDependencies > 1.5) {
        summary += `Moderate complexity with interconnected components.`;
    } else {
        summary += `Relatively simple architecture with minimal interdependencies.`;
    }
    
    return summary;
}
