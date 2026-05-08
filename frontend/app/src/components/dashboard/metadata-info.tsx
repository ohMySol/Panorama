export const data = 
    {
        date: '2024-04-1',
        chain: 'Ethereum Mainnet',
        isVerified: 'Yes',
        compiler: '0.8.21+commit',
        license: 'BUSL-1.1'
    }


export const Metadata = () => {
    return (
        <div className="flex flex-col gap-3 py-4 px-5 border-b border-b-gray-500">
            <h5 className="text-[15px] font-display text-[#C8FF3E]">METADATA</h5>
            <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between py-2 border-b border-b-gray-500">
                    <h5 className="text-[14px] text-gray-500">Deployed:</h5>
                    <p className="text-[14px] text-gray-300">{data.date}</p>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-b-gray-500">
                    <h5 className="text-[14px] text-gray-500">Chain:</h5>
                    <p className="text-[14px] text-gray-300">{data.chain}</p>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-b-gray-500">
                    <h5 className="text-[14px] text-gray-500">Verified:</h5>
                    <p className="text-[14px] text-gray-300">{data.isVerified}</p>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-b-gray-500">
                    <h5 className="text-[14px] text-gray-500">Compiler:</h5>
                    <p className="text-[14px] text-gray-300">{data.compiler}</p>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-b-gray-500">
                    <h5 className="text-[14px] text-gray-500">License:</h5>
                    <p className="text-[14px] text-gray-300">{data.license}</p>
                </div>
            </div>
        </div>
    )
}