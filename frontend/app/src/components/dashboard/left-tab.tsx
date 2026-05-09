"use client"

import { useState } from "react";
import { DependencyTree } from "./dependency-tree"
import { NodeInfo } from "./node-info"

export const LeftTab = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className={`flex flex-col h-full border-r border-r-gray-400 transition-all duration-300 ${
            isCollapsed ? 'w-0 overflow-hidden' : 'w-[300px]'
        }`}>
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute left-[300px] top-1/2 -translate-y-1/2 z-10 w-6 h-12 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-gray-700 rounded-r flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300"
                style={{ left: isCollapsed ? '0px' : '300px' }}
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                <span className="text-xs">{isCollapsed ? '›' : '‹'}</span>
            </button>
            
            <DependencyTree/>
        </div>
    )
}