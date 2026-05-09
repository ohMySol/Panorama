"use client"

import { useSelectedNode } from "@/lib/context/selected-node.context";

export const RiskScore = () => {
    const { selectedNode } = useSelectedNode();

    if (!selectedNode) {
        return (
            <div className="flex items-center gap-5 py-5 px-5 border-b border-b-gray-500">
                <p className="text-gray-500 text-sm">No node selected</p>
            </div>
        );
    }

    const riskScore = selectedNode.riskScore;

    const getRiskLevel = (score: number) => {
        if (score < 40) return { label: "LOW RISK", color: "#4ade80" };
        if (score < 60) return { label: "MEDIUM RISK", color: "#C8FF3E" };
        if (score < 80) return { label: "HIGH RISK", color: "#fb923c" };
        return { label: "CRITICAL RISK", color: "#ef4444" };
    };

    const riskLevel = getRiskLevel(riskScore);
    
    return (
        <div className="flex items-center gap-5 py-5 px-5 border-b border-b-gray-500">
            <h5 className="text-[48px] font-display" style={{ color: riskLevel.color }}>
                {riskScore}
            </h5>
            <div className="flex flex-col gap-1.5 flex-1">
                <p className="text-[12px] text-gray-500">RISK SCORE / 100</p>
                
                <div className="w-full h-2 bg-[#1a1a1a] overflow-hidden">
                    <div 
                        className="h-full transition-all duration-500"
                        style={{ 
                            width: `${riskScore}%`,
                            backgroundColor: riskLevel.color
                        }}
                    />
                </div>
                
                <div>
                    <h5 className="text-[12px] font-display" style={{ color: riskLevel.color }}>
                        {riskLevel.label}
                    </h5>
                </div>
            </div>
        </div>
    );
};