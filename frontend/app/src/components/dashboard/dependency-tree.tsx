"use client"

import { useState } from "react";
import type { GraphResponse, GraphNode, GraphEdge } from "@risk-terminal/shared";
import { getNodeDisplayName, getNodeSubtitle } from "@/lib/utils/node-display";

interface TreeNode {
    id: string;
    name: string;
    subtitle: string;
    children?: TreeNode[];
}

interface DependencyTreeProps {
    graphData?: GraphResponse;
}

const TreeItem = ({ node, level = 0 }: { node: TreeNode; level?: number }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div>
            <div 
                className={`flex items-center justify-between py-1 ${hasChildren ? 'cursor-pointer' : ''} transition-colors `}
                style={{ paddingLeft: `${level * 24 + 12}px` }}
                onClick={() => hasChildren && setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    {hasChildren ? (
                        <div className="w-3 h-3 flex items-center justify-center text-[#C8FF3E] text-xs font-bold">
                            {isExpanded ? '▼' : '▶'}
                        </div>
                    ) : (
                        <div className="w-3 h-3 rounded-[3px] bg-[#C8FF3E]" />
                    )}
                    
                    <span className="text-[14px] text-gray-300 font-mono truncate max-w-[180px]">
                        {node.name} <span className="text-gray-500">{node.subtitle}</span>
                    </span>
                </div>
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

        const nodeMap = new Map<string, GraphNode>();
        data.nodes.forEach(node => {
            nodeMap.set(node.address, node);
        });

        const childrenMap = new Map<string, string[]>();
        data.edges.forEach(edge => {
            if (!childrenMap.has(edge.from)) {
                childrenMap.set(edge.from, []);
            }
            childrenMap.get(edge.from)!.push(edge.to);
        });

        const buildNode = (address: string, visited = new Set<string>()): TreeNode | null => {
            if (visited.has(address)) return null;
            visited.add(address);

            const graphNode = nodeMap.get(address);
            if (!graphNode) return null;

            // Check if this is the root node
            const isRoot = address === data.root;
            
            // Find incoming edge for this node
            const incomingEdge = data.edges.find(edge => edge.to === address);
            
            // Use utility functions to get display name and subtitle
            const displayName = getNodeDisplayName(graphNode, incomingEdge, isRoot);
            const subtitle = getNodeSubtitle(graphNode, incomingEdge, isRoot);

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
                name: displayName,
                subtitle: subtitle,
                children: children.length > 0 ? children : undefined,
            };
        };

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
            <div className="flex flex-col px-5 pt-5">
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
            <div className="flex flex-col px-5 pt-5">
                <div className="flex items-center justify-between mb-4">
                    <h5 className="text-[15px] font-display text-[#C8FF3E]">DEPENDENCY TREE</h5>
                </div>
                <div className="text-gray-400 text-sm">Unable to build tree</div>
            </div>
        );
    }

    const totalNodes = countNodes(treeData);

    return (
        <div className="flex flex-col px-5 pt-5">
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