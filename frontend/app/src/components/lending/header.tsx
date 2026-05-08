import Image from "next/image"

export const Header = () => {
    return (
        <header className="flex items-center justify-between py-8">
            <div className="flex items-center gap-4">
                <Image width={60} height={60} alt="argus-logo" src="/argus-logo.svg"/>
                <h3 className="text-[28px] font-display">PANORAMA</h3>
            </div>
        </header>
    )
}