"use client"

import { useEffect, useRef, useState } from "react";

interface Node {
    id: string;
    label: string;
    subtitle: string;
    type: "root" | "protocol" | "oracle" | "collateral" | "admin" | "feed" | "issuer" | "multisig";
    risk: number;
    x: number;
    y: number;
}

interface Edge {
    from: string;
    to: string;
}

const nodes: Node[] = [
    { id: "market", label: "Morpho Blue Market", subtitle: "weETH / USDC · 86% LLTV", type: "root", risk: 62, x: 400, y: 80 },
    { id: "protocol", label: "Morpho Blue Core", subtitle: "SINGLETON", type: "protocol", risk: 35, x: 100, y: 250 },
    { id: "curve", label: "Adaptive Curve", subtitle: "RATE MODEL", type: "protocol", risk: 28, x: 250, y: 250 },
    { id: "oracle", label: "MorphoChainlinkOracle", subtitle: "ORACLE", type: "oracle", risk: 65, x: 400, y: 250 },
    { id: "weeth", label: "weETH", subtitle: "COLLATERAL", type: "collateral", risk: 58, x: 700, y: 250 },
    { id: "multisig", label: "Morpho DAO Multisig", subtitle: "ADMIN", type: "multisig", risk: 51, x: 100, y: 450 },
    { id: "aggregator", label: "Chainlink Aggregator", subtitle: "FEED", type: "feed", risk: 42, x: 400, y: 450 },
    { id: "etherfi", label: "EtherFi LiquidityPool", subtitle: "ISSUER", type: "issuer", risk: 64, x: 700, y: 450 },
    { id: "etherfi-multisig", label: "EtherFi 4/7 Multisig", subtitle: "ADMIN", type: "multisig", risk: 67, x: 700, y: 620 },
];

const edges: Edge[] = [
    { from: "market", to: "protocol" },
    { from: "market", to: "curve" },
    { from: "market", to: "oracle" },
    { from: "market", to: "weeth" },
    { from: "protocol", to: "multisig" },
    { from: "oracle", to: "aggregator" },
    { from: "weeth", to: "etherfi" },
    { from: "etherfi", to: "etherfi-multisig" },
];

const getRiskColor = (risk: number) => {
    if (risk < 40) return "#4ade80"; // green - LOW
    if (risk < 60) return "#C8FF3E"; // lime - MED
    if (risk < 80) return "#fb923c"; // orange - HIGH
    return "#ef4444"; // red - CRIT
};

export const DashboardGraph = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 700 });
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const updateDimensions = () => {
            if (svgRef.current) {
                const parent = svgRef.current.parentElement;
                if (parent) {
                    setDimensions({
                        width: parent.clientWidth,
                        height: parent.clientHeight || 700,
                    });
                }
            }
        };

        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    // Zoom with mouse wheel
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            
            const delta = e.deltaY * -0.001;
            const newScale = Math.min(Math.max(0.3, transform.scale + delta), 3);
            
            // Zoom towards mouse position
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const scaleRatio = newScale / transform.scale;
            const newX = mouseX - (mouseX - transform.x) * scaleRatio;
            const newY = mouseY - (mouseY - transform.y) * scaleRatio;
            
            setTransform({
                x: newX,
                y: newY,
                scale: newScale,
            });
        };

        container.addEventListener("wheel", handleWheel, { passive: false });
        return () => container.removeEventListener("wheel", handleWheel);
    }, [transform]);

    // Pan with mouse drag
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleMouseDown = (e: MouseEvent) => {
            if (e.button === 0) { // Left mouse button
                setIsPanning(true);
                setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (isPanning) {
                setTransform(prev => ({
                    ...prev,
                    x: e.clientX - panStart.x,
                    y: e.clientY - panStart.y,
                }));
            }
        };

        const handleMouseUp = () => {
            setIsPanning(false);
        };

        container.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            container.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isPanning, panStart, transform.x, transform.y]);

    const getNodeById = (id: string) => nodes.find(n => n.id === id);

    // Reset zoom button handler
    const handleResetZoom = () => {
        setTransform({ x: 0, y: 0, scale: 1 });
    };

    return (
        <div 
            ref={containerRef}
            className="flex flex-1 relative bg-[#0a0a0a] p-6 overflow-hidden"
            style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        >
            <svg
                ref={svgRef}
                width={dimensions.width}
                height={dimensions.height}
                className="w-full h-full"
            >
                <defs>
                    {/* Glow filter for highlighted nodes */}
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>

                {/* Apply transform to entire graph */}
                <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
                    {/* Draw edges with curves */}
                    <g className="edges">
                        {edges.map((edge, i) => {
                            const from = getNodeById(edge.from);
                            const to = getNodeById(edge.to);
                            if (!from || !to) return null;

                            const isHighlighted = hoveredNode === edge.from || hoveredNode === edge.to;
                            
                            // Calculate curve control point
                            const midX = (from.x + to.x) / 2;
                            const midY = (from.y + to.y) / 2;
                            const dx = to.x - from.x;
                            const dy = to.y - from.y;
                            const offset = 30;
                            const controlX = midX - dy * offset / Math.sqrt(dx * dx + dy * dy);
                            const controlY = midY + dx * offset / Math.sqrt(dx * dx + dy * dy);

                            return (
                                <path
                                    key={`edge-${i}`}
                                    d={`M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`}
                                    stroke={isHighlighted ? getRiskColor(Math.max(from.risk, to.risk)) : "#2a2a2a"}
                                    strokeWidth={isHighlighted ? 2.5 : 1.5}
                                    fill="none"
                                    strokeDasharray={from.type === "root" || to.type === "root" ? "0" : "4 4"}
                                    className="transition-all duration-300"
                                />
                            );
                        })}
                    </g>

                    {/* Draw nodes */}
                    <g className="nodes">
                        {nodes.map((node) => {
                            const isHovered = hoveredNode === node.id;
                            const isRoot = node.type === "root";
                            const color = getRiskColor(node.risk);
                            const width = isRoot ? 380 : 220;
                            const height = isRoot ? 80 : 60;

                            return (
                                <g
                                    key={node.id}
                                    transform={`translate(${node.x - width / 2}, ${node.y - height / 2})`}
                                    onMouseEnter={() => setHoveredNode(node.id)}
                                    onMouseLeave={() => setHoveredNode(null)}
                                    className="cursor-pointer"
                                    filter={isHovered ? "url(#glow)" : undefined}
                                >
                                    {/* Node background */}
                                    <rect
                                        width={width}
                                        height={height}
                                        rx={4}
                                        fill="#0f0f0f"
                                        stroke={color}
                                        strokeWidth={isHovered ? 2.5 : 1.5}
                                        className="transition-all duration-300"
                                    />

                                    {/* Color indicator square */}
                                    <rect
                                        x={12}
                                        y={height / 2 - 6}
                                        width={12}
                                        height={12}
                                        rx={2}
                                        fill={color}
                                    />

                                    {/* Node label */}
                                    <text
                                        x={32}
                                        y={height / 2 - 4}
                                        fill="#e5e5e5"
                                        fontSize={isRoot ? 16 : 13}
                                        fontFamily="monospace"
                                        fontWeight="500"
                                    >
                                        {node.label}
                                    </text>

                                    {/* Node subtitle */}
                                    <text
                                        x={32}
                                        y={height / 2 + 12}
                                        fill="#666"
                                        fontSize={10}
                                        fontFamily="monospace"
                                        textTransform="uppercase"
                                    >
                                        {node.subtitle}
                                    </text>

                                    {/* Risk score */}
                                    <text
                                        x={width - 16}
                                        y={height / 2 + 6}
                                        fill={color}
                                        fontSize={isRoot ? 20 : 16}
                                        fontFamily="monospace"
                                        fontWeight="bold"
                                        textAnchor="end"
                                    >
                                        {node.risk}
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                </g>
            </svg>

            {/* Zoom controls */}
            <div className="absolute top-6 right-6 flex flex-col gap-2">
                <button
                    onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(prev.scale + 0.2, 3) }))}
                    className="w-8 h-8 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-gray-700 rounded flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                    title="Zoom In"
                >
                    +
                </button>
                <button
                    onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(prev.scale - 0.2, 0.3) }))}
                    className="w-8 h-8 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-gray-700 rounded flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                    title="Zoom Out"
                >
                    −
                </button>
                <button
                    onClick={handleResetZoom}
                    className="w-8 h-8 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-gray-700 rounded flex items-center justify-center text-gray-400 hover:text-white transition-colors text-xs"
                    title="Reset Zoom"
                >
                    ⟲
                </button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-6 left-6 flex items-center gap-6 text-xs font-mono">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-[#4ade80]" />
                    <span className="text-gray-500">LOW 0-39</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-[#C8FF3E]" />
                    <span className="text-gray-500">MED 40-59</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-[#fb923c]" />
                    <span className="text-gray-500">HIGH 60-79</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-[#ef4444]" />
                    <span className="text-gray-500">CRIT 80-100</span>
                </div>
            </div>

            {/* Stats */}
            <div className="absolute bottom-6 right-6 text-xs font-mono text-gray-500">
                <span>{nodes.length} nodes · {edges.length} edges · zoom: {(transform.scale * 100).toFixed(0)}%</span>
            </div>
        </div>
    );
};
