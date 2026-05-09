"use client"

import { useSelectedNode } from "@/lib/context/selected-node.context";

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
    
    // Check for ERC20 metadata
    const isERC20 = selectedNode.type === "erc20" && metadata?.symbol;
    
    // Check for Safe multisig metadata
    const isSafeMultisig = selectedNode.type === "safe" && (metadata?.signerCount || metadata?.signerThreshold);

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
                            <p className="text-[14px] text-gray-300 font-mono">{String(metadata.symbol)}</p>
                        </div>
                        {metadata.decimals !== undefined && (
                            <div className="flex items-center justify-between py-2 border-b border-b-gray-500">
                                <h5 className="text-[14px] text-gray-500">Decimals:</h5>
                                <p className="text-[14px] text-gray-300">{String(metadata.decimals)}</p>
                            </div>
                        )}
                        {metadata.totalSupply && (
                            <div className="flex items-center justify-between py-2 border-b border-b-gray-500">
                                <h5 className="text-[14px] text-gray-500">Total Supply:</h5>
                                <p className="text-[14px] text-gray-300 font-mono text-right break-all">
                                    {String(metadata.totalSupply)}
                                </p>
                            </div>
                        )}
                    </>
                )}

                {isSafeMultisig && (
                    <>
                        {metadata.signerThreshold !== undefined && metadata.signerCount !== undefined && (
                            <div className="flex items-center justify-between py-2 border-b border-b-gray-500">
                                <h5 className="text-[14px] text-gray-500">Threshold:</h5>
                                <p className="text-[14px] text-gray-300">
                                    {String(metadata.signerThreshold)} / {String(metadata.signerCount)}
                                </p>
                            </div>
                        )}
                        {metadata.nonce !== undefined && (
                            <div className="flex items-center justify-between py-2 border-b border-b-gray-500">
                                <h5 className="text-[14px] text-gray-500">Nonce:</h5>
                                <p className="text-[14px] text-gray-300">{String(metadata.nonce)}</p>
                            </div>
                        )}
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
