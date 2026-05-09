"use client"

import { useState } from "react";
import type { GraphResponse, GraphNode, GraphEdge } from "@risk-terminal/shared";

interface TreeNode {
    id: string;
    name: string;
    type: string;
    color: "orange" | "green" | "red";
    riskScore: number;
    children?: TreeNode[];
}

interface DependencyTreeProps {
    graphData?: GraphResponse;
}

const TreeItem = ({ node, level = 0 }: { node: TreeNode; level?: number }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;

    const colorClasses = {
        orange: "bg-[#C8FF3E]",
        green: "bg-[#4ade80]",
        red: "bg-[#ef4444]",
    };

    return (
        <div>
            <div 
                className={`flex items-center justify-between py-1 cursor-pointer transition-colors `}
                style={{ paddingLeft: `${level * 24 + 12}px` }}
                onClick={() => hasChildren && setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-[3px] ${colorClasses[node.color]}`} /> 
                    {hasChildren && (
                        <span className="text-gray-500 text-xs">
                            {isExpanded ? "└" : "├"}
                        </span>
                    )}
                    
                    <span className="text-[14px] text-gray-300 font-mono truncate max-w-[180px]">
                        {node.name}
                    </span>
                </div>
                
                <span className="text-[11px] text-gray-500 uppercase font-mono">{node.type}</span>
            </div>
            
            {hasChildren && isExpanded && (
                <div>
                    {node.children!.map((child) => (
                        <TreeItem key={child.id} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

export const DependencyTree = ({ graphData }: DependencyTreeProps) => {
    const buildTree = (data: GraphResponse): TreeNode | null => {
        if (!data || !data.nodes || data.nodes.length === 0) return null;

        // Create a map of nodes by address
        const nodeMap = new Map<string, GraphNode>();
        data.nodes.forEach(node => {
            nodeMap.set(node.address, node);
        });

        // Create a map to track children for each node
        const childrenMap = new Map<string, string[]>();
        data.edges.forEach(edge => {
            if (!childrenMap.has(edge.from)) {
                childrenMap.set(edge.from, []);
            }
            childrenMap.get(edge.from)!.push(edge.to);
        });

        // Helper function to determine color based on risk score
        const getColor = (riskScore: number): "orange" | "green" | "red" => {
            if (riskScore < 30) return "green";
            if (riskScore < 70) return "orange";
            return "red";
        };

        // Recursive function to build tree
        const buildNode = (address: string, visited = new Set<string>()): TreeNode | null => {
            if (visited.has(address)) return null; // Prevent cycles
            visited.add(address);

            const graphNode = nodeMap.get(address);
            if (!graphNode) return null;

            const children: TreeNode[] = [];
            const childAddresses = childrenMap.get(address) || [];
            
            childAddresses.forEach(childAddress => {
                const childNode = buildNode(childAddress, new Set(visited));
                if (childNode) {
                    children.push(childNode);
                }
            });

            return {
                id: graphNode.address,
                name: graphNode.name || `${graphNode.address.slice(0, 6)}...${graphNode.address.slice(-4)}`,
                type: graphNode.type.toUpperCase(),
                color: getColor(graphNode.riskScore),
                riskScore: graphNode.riskScore,
                children: children.length > 0 ? children : undefined,
            };
        };

        // Build tree starting from root
        return buildNode(data.root);
    };

    const countNodes = (node: TreeNode): number => {
        let count = 1;
        if (node.children) {
            node.children.forEach(child => {
                count += countNodes(child);
            });
        }
        return count;
    };

    if (!graphData) {
        return (
            <div className="flex flex-col py-5 px-5">
                <div className="flex items-center justify-between mb-4">
                    <h5 className="text-[15px] font-display text-[#C8FF3E]">DEPENDENCY TREE</h5>
                </div>
                <div className="text-gray-400 text-sm">No data available</div>
            </div>
        );
    }

    const treeData = buildTree(graphData);
    
    if (!treeData) {
        return (
            <div className="flex flex-col py-5 px-5">
                <div className="flex items-center justify-between mb-4">
                    <h5 className="text-[15px] font-display text-[#C8FF3E]">DEPENDENCY TREE</h5>
                </div>
                <div className="text-gray-400 text-sm">Unable to build tree</div>
            </div>
        );
    }

    const totalNodes = countNodes(treeData);

    return (
        <div className="flex flex-col py-5 px-5">
            <div className="flex items-center justify-between mb-4">
                <h5 className="text-[15px] font-display text-[#C8FF3E]">DEPENDENCY TREE</h5>
                <span className="text-[15px] font-display italic text-white">{totalNodes} NODES</span>
            </div>
            
            <div className="flex flex-col">
                <TreeItem node={treeData} />
            </div>
        </div>
    );
};