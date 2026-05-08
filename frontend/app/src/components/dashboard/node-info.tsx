export const NodeInfo = () => {
    return (
        <div className="flex flex-col px-5 pb-5 border-b border-b-gray-400">
            <div className="flex items-center justify-between w-full ">
                <h3 className="text-[22px] font-display leading-[32px]">weETH</h3>
                <div className="text-[#C8FF3E] text-[12px] leading-3 border border-[#C8FF3E] px-3 py-1.5">ASSET</div>
            </div>
            <div className="flex items-center gap-2">
                <p className="text-[12px] text-gray-400">0xCd5f…8eEe</p>
                <div className="transition-all duration-200 cursor-pointer border border-gray-600 hover:border-[#C8FF3E] px-1.5 py-1 text-[10px] hover:text-[#C8FF3E] leading-2.5 text-gray-400">COPY</div>
                <div className="transition-all font-display duration-200 cursor-pointer border border-gray-600 hover:border-[#C8FF3E] px-1 py-1 text-[14px] hover:text-[#C8FF3E] leading-2.5 text-gray-400">↗</div> 
            </div>
        </div>
    )
}