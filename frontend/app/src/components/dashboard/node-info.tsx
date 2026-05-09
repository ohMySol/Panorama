"use client"

import { useSelectedNode } from "@/lib/context/selected-node.context";

export const NodeInfo = () => {
    const { selectedNode } = useSelectedNode();

    if (!selectedNode) {
        return (
            <div className="flex flex-col px-5 pb-5 border-b border-b-gray-400">
                <p className="text-gray-500 text-sm">Select a node to view details</p>
            </div>
        );
    }

    const shortAddress = `${selectedNode.address.slice(0, 6)}…${selectedNode.address.slice(-4)}`;

    // For ERC20 tokens, prefer symbol from metadata
    const displayName = selectedNode.type === "erc20" && selectedNode.metadata?.symbol
        ? String(selectedNode.metadata.symbol)
        : selectedNode.name || shortAddress;

    const handleCopy = () => {
        navigator.clipboard.writeText(selectedNode.address);
    };

    const handleOpenEtherscan = () => {
        window.open(`https://etherscan.io/address/${selectedNode.address}`, '_blank');
    };

    return (
        <div className="flex flex-col px-5 pb-5 border-b border-b-gray-400">
            <div className="flex items-center justify-between w-full ">
                <h3 className="text-[22px] font-display leading-[32px]">
                    {displayName}
                </h3>
                <div className="text-[#C8FF3E] text-[12px] leading-3 border border-[#C8FF3E] px-3 py-1.5 uppercase">
                    {selectedNode.type}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <p className="text-[12px] text-gray-400">{shortAddress}</p>
                <button
                    onClick={handleCopy}
                    className="transition-all duration-200 cursor-pointer border border-gray-600 hover:border-[#C8FF3E] px-1.5 py-1 text-[10px] hover:text-[#C8FF3E] leading-2.5 text-gray-400"
                >
                    COPY
                </button>
                <button
                    onClick={handleOpenEtherscan}
                    className="transition-all font-display duration-200 cursor-pointer border border-gray-600 hover:border-[#C8FF3E] px-1 py-1 text-[14px] hover:text-[#C8FF3E] leading-2.5 text-gray-400"
                >
                    ↗
                </button>
            </div>
        </div>
    );
};