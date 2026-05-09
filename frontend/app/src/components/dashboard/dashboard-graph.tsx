"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react";

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
    if (risk < 40) return "#4ade80";
    if (risk < 60) return "#C8FF3E";
    if (risk < 80) return "#fb923c";
    return "#ef4444";
};

export const DashboardGraph = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 700 });
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef({ x: 0, y: 0 });

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

    // Optimized zoom handler
    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();
        
        const delta = e.deltaY * -0.001;
        const newScale = Math.min(Math.max(0.3, transform.scale + delta), 3);
        
        if (!containerRef.current) return;
        
        const rect = containerRef.current.getBoundingClientRect();
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
    }, [transform.scale, transform.x, transform.y]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener("wheel", handleWheel, { passive: false });
        return () => container.removeEventListener("wheel", handleWheel);
    }, [handleWheel]);

    // Optimized pan handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 0) {
            setIsPanning(true);
            panStartRef.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
        }
    }, [transform.x, transform.y]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isPanning) {
            setTransform(prev => ({
                ...prev,
                x: e.clientX - panStartRef.current.x,
                y: e.clientY - panStartRef.current.y,
            }));
        }
    }, [isPanning]);

    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
    }, []);

    useEffect(() => {
        if (isPanning) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
            return () => {
                window.removeEventListener("mousemove", handleMouseMove);
                window.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [isPanning, handleMouseMove, handleMouseUp]);

    const getNodeById = useCallback((id: string) => nodes.find(n => n.id === id), []);

    const handleResetZoom = useCallback(() => {
        setTransform({ x: 0, y: 0, scale: 1 });
    }, []);

    const handleZoomIn = useCallback(() => {
        setTransform(prev => ({ ...prev, scale: Math.min(prev.scale + 0.2, 3) }));
    }, []);

    const handleZoomOut = useCallback(() => {
        setTransform(prev => ({ ...prev, scale: Math.max(prev.scale - 0.2, 0.3) }));
    }, []);

    // Memoize edge paths to avoid recalculation
    const edgePaths = useMemo(() => {
        return edges.map((edge, i) => {
            const from = getNodeById(edge.from);
            const to = getNodeById(edge.to);
            if (!from || !to) return null;

            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const offset = 30;
            const controlX = midX - dy * offset / Math.sqrt(dx * dx + dy * dy);
            const controlY = midY + dx * offset / Math.sqrt(dx * dx + dy * dy);

            return {
                key: `edge-${i}`,
                path: `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`,
                from: edge.from,
                to: edge.to,
                fromNode: from,
                toNode: to,
            };
        }).filter(Boolean);
    }, [getNodeById]);

    return (
        <div 
            ref={containerRef}
            className="flex flex-1 relative bg-[#0a0a0a] p-6 overflow-hidden select-none"
            style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown}
        >
            <svg
                ref={svgRef}
                width={dimensions.width}
                height={dimensions.height}
                className="w-full h-full"
            >
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>

                <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
                    <g className="edges">
                        {edgePaths.map((edge) => {
                            if (!edge) return null;
                            const isHighlighted = hoveredNode === edge.from || hoveredNode === edge.to;
                            
                            return (
                                <path
                                    key={edge.key}
                                    d={edge.path}
                                    stroke={isHighlighted ? getRiskColor(Math.max(edge.fromNode.risk, edge.toNode.risk)) : "#2a2a2a"}
                                    strokeWidth={isHighlighted ? 2.5 : 1.5}
                                    fill="none"
                                    strokeDasharray={edge.fromNode.type === "root" || edge.toNode.type === "root" ? "0" : "4 4"}
                                    style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
                                />
                            );
                        })}
                    </g>

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
                                    style={{ cursor: 'pointer' }}
                                    filter={isHovered ? "url(#glow)" : undefined}
                                >
                                    <rect
                                        width={width}
                                        height={height}
                                        rx={4}
                                        fill="#0f0f0f"
                                        stroke={color}
                                        strokeWidth={isHovered ? 2.5 : 1.5}
                                        style={{ transition: 'stroke-width 0.2s' }}
                                    />

                                    <rect
                                        x={12}
                                        y={height / 2 - 6}
                                        width={12}
                                        height={12}
                                        rx={2}
                                        fill={color}
                                    />

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

                                    <text
                                        x={32}
                                        y={height / 2 + 12}
                                        fill="#666"
                                        fontSize={10}
                                        fontFamily="monospace"
                                        style={{ textTransform: 'uppercase' }}
                                    >
                                        {node.subtitle}
                                    </text>

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

            <div className="absolute top-6 right-6 flex flex-col gap-2">
                <button
                    onClick={handleZoomIn}
                    className="w-8 h-8 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-gray-700 rounded flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                    title="Zoom In"
                >
                    +
                </button>
                <button
                    onClick={handleZoomOut}
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

            <div className="absolute bottom-6 right-6 text-xs font-mono text-gray-500">
                <span>{nodes.length} nodes · {edges.length} edges · zoom: {(transform.scale * 100).toFixed(0)}%</span>
            </div>
        </div>
    );
};
