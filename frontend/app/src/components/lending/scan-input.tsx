import Link from "next/link"

export const ScanInput = () => {
    return (
        <div className="flex items-center w-[560px] h-[50px]">
            <div className="flex items-center justify-center gap-2 px-5 py-2 h-full border border-gray-700">
                <div className="w-2 h-2 bg-[#C8F3EE]"></div>
                Scan
            </div>
            <input placeholder="0xA1D94F746dEfa1928926b84fB2596c06926C0405" className="px-4 text-[14px] flex-1 h-full border border-gray-700 text-white placeholder:text-gray-500 ring-o outline-none" type="text" />
            <Link className="h-full" href="/dashboard">
            <button className="font-display cursor-pointer px-5 py-2 h-full text-black bg-[#C8FF3E] hover:bg-[#d1fa69] border border-gray-700">Analyze </button></Link>
        </div>
    )
}
