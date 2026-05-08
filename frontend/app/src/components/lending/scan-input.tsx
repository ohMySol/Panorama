export const ScanInput = () => {
    return (
        <div className="flex items-center w-[500px] h-[50px]">
            <div className="flex items-center justify-center px-5 py-2 h-full border border-gray-700">Scan</div>
            <input placeholder="address" className="px-6 h-full border border-gray-700 text-white placeholder:text-gray-200 ring-o outline-none" type="text" />
            <button className="font-display px-5 py-2 h-full text-black bg-[#ffb53e] border border-gray-700">ANALYZE </button>
        </div>
    )
}
