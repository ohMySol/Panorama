import { DependencyTree } from "./dependency-tree"
import { NodeInfo } from "./node-info"

export const LeftTab = () => {
    return (
        <div className="flex flex-col w-[300px] h-full border-r border-r-gray-400">
            <DependencyTree/>
        </div>
    )
}