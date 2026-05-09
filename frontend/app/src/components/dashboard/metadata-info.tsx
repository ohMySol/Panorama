"use client"

import { useSelectedNode } from "@/lib/context/selected-node.context";
import { useLatestGraphAnalysis } from "@/lib/hooks/useGraphAnalysis";
import { useAiSummary } from "@/lib/hooks/useAiSummary";

export const Metadata = () => {
    const { selectedNode } = useSelectedNode();
    const { data: graphData } = useLatestGraphAnalysis();
    const { data: aiSummary, isLoading: isLoadingSummary, error: summaryError } = useAiSummary(
        graphData,
        !selectedNode && !!graphData
    );

    if (!selectedNode) {
        return (
            <div className="flex flex-col gap-3 py-4 px-5 border-b border-b-gray-500">
                <h5 className="text-[15px] font-display text-[#C8FF3E]">PROTOCOL SUMMARY</h5>
                {!graphData ? (
                    <p className="text-gray-500 text-sm">No graph data available</p>
                ) : isLoadingSummary ? (
                    <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-[#C8FF3E] border-t-transparent rounded-full"></div>
                        <p className="text-gray-400 text-sm">Generating AI summary...</p>
                    </div>
                ) : summaryError ? (
                    <p className="text-gray-500 text-sm">Unable to generate summary</p>
                ) : aiSummary ? (
                    <div className="flex flex-col gap-3">
                        <p className="text-gray-300 text-[13px] leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 pt-1">
                            <span className="inline-block w-2 h-2 bg-[#C8FF3E] rounded-full animate-pulse"></span>
                            <span>AI-generated analysis</span>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm">No summary available</p>
                )}
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
