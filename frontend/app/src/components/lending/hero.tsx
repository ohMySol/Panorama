import { ArgusGraph } from "./graph";
import {ScanInput} from "./scan-input"

export const Hero = () => {
    return (
        <div className="flex w-full flex-1 items-center gap-10 h-full">
            <div className="flex flex-col gap-10">
                <h3 className="text-[64px] leading-[60px] font-display w-[550px]">Map every <span className="text-[#C8FF3E]">dependency</span>. Score every <span className="text-[#C8FF3E]">risk</span>.</h3>
                <p className="text-gray-400 leading-[18px] w-[550px]">Paste a contract. Panorama walks the dependency graph from the entry point down — protocol, oracles, modules, admins, issuers - and attaches a quantified risk score to every node.</p>
                <ScanInput/>
            </div>

            <div className="flex-1 h-full relative">
                <div className="absolute right-[-200px] top-[-430px] w-[900px] h-[2600px] pointer-events-none opacity-80">
                    <ArgusGraph/>
                </div>
            </div>
        </div>
    )
}