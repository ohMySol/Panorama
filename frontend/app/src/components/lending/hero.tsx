import { ArgusGraph } from "./graph"
import {ScanInput} from "./scan-input"

export const Hero = () => {
    return (
        <div className="flex w-full flex-1 items-center justify-between gap-10 h-full">
            <div className="flex flex-col  gap-10">
                <h3 className="text-[64px] leading-[70px] font-display w-[550px]">Map every <span className="text-[#ffb53e]">dependency</span>. Score every <span className="text-[#ffb53e]">risk</span>.</h3>
                <p className="text-gray-300 w-[550px]">Paste a contract. Panorama walks the dependency graph from the entry point down — protocol, oracles, modules, admins, issuers - and attaches a quantified risk score to every node.</p>
                <ScanInput/>
            </div>

            <ArgusGraph/>
        </div>
    )
}