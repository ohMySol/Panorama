"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ScanInput } from "./scan-input"

export const Header = () => {
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith('/dashboard/');

    return (
        <header className="flex items-center justify-between py-6 px-20">
            <Link href="/">
                <div className="flex items-center gap-4">
                    <Image width={45} height={45} alt="argus-logo" src="/argus-logo.png"/>
                    <h3 className="text-[22px] font-display">PANORAMA</h3>
                </div>
            </Link>
            {isDashboard && <ScanInput />}
        </header>
    )
}