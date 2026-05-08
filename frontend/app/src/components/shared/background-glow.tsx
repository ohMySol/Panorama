"use client"

import { usePathname } from "next/navigation";

export const BackgroundGlow = () => {
    const pathname = usePathname();
    const isDashboard = pathname === "/dashboard";
    
    return (
        <>
            <div 
                className={`absolute z-0 w-[350px] h-[350px] rounded-full bottom-[-100px] left-[-200px] blur-[230px] bg-[#C8FF3E] transition-opacity duration-500 ${
                    isDashboard ? "opacity-20" : "opacity-100"
                }`}
            />
            <div 
                className={`absolute z-0 w-[310px] h-[310px] rounded-full top-[-100px] right-[-200px] blur-[230px] bg-[#C8FF3E] transition-opacity duration-500 ${
                    isDashboard ? "opacity-20" : "opacity-100"
                }`}
            />
        </>
    );
};
