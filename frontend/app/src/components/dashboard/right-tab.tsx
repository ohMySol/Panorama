import { Metadata } from "./metadata-info"
import { NodeInfo } from "./node-info"

export const RightTab = () => {
    return (
        <div className="flex flex-col w-[300px] h-full border-l border-l-gray-400">
            <div className="pt-4">
                <NodeInfo/>
                <Metadata/>
            </div>
        </div>
    )
}