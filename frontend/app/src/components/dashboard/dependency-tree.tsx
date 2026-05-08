"use client"

import { useState } from "react";

interface TreeNode {
    id: string;
    name: string;
    type: string;
    color: "orange" | "green" | "red";
    children?: TreeNode[];
}

const treeData: TreeNode = {
    id: "root",
    name: "Morpho Blue Market",
    type: "ROOT",
    color: "orange",
    children: [
        {
            id: "protocol-1",
            name: "Morpho Blue Core",
            type: "PROTOCOL",
            color: "green",
            children: [
                {
                    id: "multisig-1",
                    name: "Morpho DAO Multis...",
                    type: "5/9",
                    color: "orange",
                }
            ]
        },
        {
            id: "module-1",
            name: "Adaptive Curve I...",
            type: "MODULE",
            color: "green",
        },
        {
            id: "oracle-1",
            name: "MorphoChainLinkO...",
            type: "ORACLE",
            color: "red",
            children: [
                {
                    id: "feed-1",
                    name: "Chainlink Aggreg...",
                    type: "FEED",
                    color: "orange",
                }
            ]
        },
        {
            id: "asset-1",
            name: "weETH (Token)",
            type: "ASSET",
            color: "orange",
            children: [
                {
                    id: "issuer-1",
                    name: "EtherFi Liquidi...",
                    type: "ISSUER",
                    color: "orange",
                    children: [
                        {
                            id: "admin-1",
                            name: "EtherFi 4/7 Mu...",
                            type: "ADMIN",
                            color: "red",
                        }
                    ]
                }
            ]
        },
        {
            id: "asset-2",
            name: "USDC (Token)",
            type: "ASSET",
            color: "green",
            children: [
                {
                    id: "entity-1",
                    name: "Circle Issuer",
                    type: "ENTITY",
                    color: "green",
                }
            ]
        }
    ]
};

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
                    
                    <span className="text-[14px] text-gray-300 font-mono">{node.name}</span>
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

export const DependencyTree = () => {
    const countNodes = (node: TreeNode): number => {
        let count = 1;
        if (node.children) {
            node.children.forEach(child => {
                count += countNodes(child);
            });
        }
        return count;
    };

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
    )
}