import Image from "next/image"

export const Header = () => {
    return (
        <header className="flex items-center justify-between py-8 px-20">
            <div className="flex items-center gap-4">
                <Image width={45} height={45} alt="argus-logo" src="/argus-logo.png"/>
                <h3 className="text-[22px] font-display">PANORAMA</h3>
            </div>
        </header>
    )
}