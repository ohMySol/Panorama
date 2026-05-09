"use client"

import { useSelectedNode } from "@/lib/context/selected-node.context";
import type { ERC20Metadata, MultisigMetadata } from "@risk-terminal/shared";

const isERC20Metadata = (metadata: any): metadata is ERC20Metadata => {
    return metadata && 'symbol' in metadata && 'decimals' in metadata;
};

const isMultisigMetadata = (metadata: any): metadata is MultisigMetadata => {
    return metadata && 'owners' in metadata && 'threshold' in metadata;
};

export const Metadata = () => {
    const { selectedNode } = useSelectedNode();

    if (!selectedNode) {
        return (
            <div className="flex flex-col gap-3 py-4 px-5 border-b border-b-gray-500">
                <h5 className="text-[15px] font-display text-[#C8FF3E]">METADATA</h5>
                <p className="text-gray-500 text-sm">No node selected</p>
            </div>
        );
    }

    const metadata = selectedNode.metadata;
    console.log('Selected node:', selectedNode);
    console.log('Metadata:', metadata);
    console.log('Node type:', selectedNode.type);
    
    const isERC20 = isERC20Metadata(metadata);
    const isMultisig = isMultisigMetadata(metadata);
    
    console.log('Is ERC20:', isERC20);
    console.log('Is Multisig:', isMultisig);

    return (
        <div className="flex flex-col gap-3 py-4 px-5 border-b border-b-gray-500">
            <h5 className="text-[15px] font-display text-[#C8FF3E]">METADATA</h5>
            <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between py-2 border-b border-b-gray-500">
                    <h5 className="text-[14px] text-gray-500">Tier:</h5>
                    <p className="text-[14px] text-gray-300">{selectedNode.tier}</p>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-b-gray-500">
                    <h5 className="text-[14px] text-gray-500">Source Available:</h5>
                    <p className="text-[14px] text-gray-300">{selectedNode.sourceAvailable ? 'Yes' : 'No'}</p>
                </div>
                {selectedNode.tvlUsd !== null && (
                    <div className="flex items-center justify-between py-2 border-b border-b-gray-500">
                        <h5 className="text-[14px] text-gray-500">TVL:</h5>
                        <p className="text-[14px] text-gray-300">
                            ${selectedNode.tvlUsd.toLocaleString()}
                        </p>
                    </div>
                )}
                
                {isERC20 && (
                    <>
                        <div className="flex items-center justify-between py-2 border-b border-b-gray-500">
                            <h5 className="text-[14px] text-gray-500">Symbol:</h5>
                            <p className="text-[14px] text-gray-300 font-mono">{metadata.symbol}</p>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-b-gray-500">
                            <h5 className="text-[14px] text-gray-500">Decimals:</h5>
                            <p className="text-[14px] text-gray-300">{metadata.decimals}</p>
                        </div>
                        {metadata.totalSupply && (
                            <div className="flex items-center justify-between py-2 border-b border-b-gray-500">
                                <h5 className="text-[14px] text-gray-500">Total Supply:</h5>
                                <p className="text-[14px] text-gray-300 font-mono text-right break-all">
                                    {metadata.totalSupply}
                                </p>
                            </div>
                        )}
                    </>
                )}

                {isMultisig && (
                    <>
                        <div className="flex items-center justify-between py-2 border-b border-b-gray-500">
                            <h5 className="text-[14px] text-gray-500">Threshold:</h5>
                            <p className="text-[14px] text-gray-300">
                                {metadata.threshold} / {metadata.owners.length}
                            </p>
                        </div>
                        <div className="flex flex-col py-2 border-b border-b-gray-500">
                            <h5 className="text-[14px] text-gray-500 mb-2">Owners ({metadata.owners.length}):</h5>
                            <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
                                {metadata.owners.map((owner, index) => (
                                    <div 
                                        key={index}
                                        className="text-[11px] px-2 py-1 bg-gray-800/50 text-gray-300 border border-gray-700 rounded font-mono break-all"
                                    >
                                        {owner}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {selectedNode.riskFlags.length > 0 && (
                    <div className="flex flex-col py-2 border-b border-b-gray-500">
                        <h5 className="text-[14px] text-gray-500 mb-2">Risk Flags:</h5>
                        <div className="flex flex-wrap gap-1">
                            {selectedNode.riskFlags.map((flag, index) => (
                                <span 
                                    key={index}
                                    className="text-[11px] px-2 py-1 bg-red-900/20 text-red-400 border border-red-800 rounded"
                                >
                                    {flag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};