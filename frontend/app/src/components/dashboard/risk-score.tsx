export const RiskScore = () => {
    const riskScore = 58;
    
    return (
        <div className="flex items-center gap-5 py-5 px-5 border-b border-b-gray-500">
            <h5 className="text-[48px] font-display text-[#C8FF3E]">{riskScore}</h5>
            <div className="flex flex-col gap-1.5 flex-1">
                <p className="text-[12px] text-gray-500">RISK SCORE / 100</p>
                
                <div className="w-full h-2 bg-[#1a1a1a] overflow-hidden">
                    <div 
                        className="h-full bg-[#C8FF3E] transition-all duration-500"
                        style={{ width: `${riskScore}%` }}
                    />
                </div>
                
                <div>
                    <h5 className="text-[12px] font-display text-[#C8FF3E]">MEDIUM RISK</h5>
                </div>
            </div>
        </div>
    )
}