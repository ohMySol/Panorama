"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { GraphResponse, GraphNode as BackendGraphNode, GraphEdge as BackendGraphEdge } from "@risk-terminal/shared";
import { useLatestGraphAnalysis } from "@/lib/hooks/useGraphAnalysis";
import { useSelectedNode } from "@/lib/context/selected-node.context";
import { getNodeDisplayName, getNodeSubtitle } from "@/lib/utils/node-display";

interface Node {
    id: string;
    label: string;
    subtitle: string;
    type: string;
    risk: number;
    x: number;
    y: number;
}

interface Edge {
    from: string;
    to: string;
}

export const DashboardGraph = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 700 });
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [isPanning, setIsPanning] = useState(false);
    const [draggedNode, setDraggedNode] = useState<string | null>(null);
    const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map());
    const panStartRef = useRef({ x: 0, y: 0 });
    const dragStartRef = useRef({ x: 0, y: 0, nodeX: 0, nodeY: 0 });
    const rafIdRef = useRef<number | null>(null);
    const { data: graphData } = useLatestGraphAnalysis();
    const { setSelectedNode } = useSelectedNode();

    const { initialNodes, edges } = useMemo(() => {
        if (!graphData) {
            return { initialNodes: [], edges: [] };
        }

        const childrenMap = new Map<string, string[]>();
        graphData.edges.forEach(edge => {
            if (!childrenMap.has(edge.from)) {
                childrenMap.set(edge.from, []);
            }
            childrenMap.get(edge.from)!.push(edge.to);
        });

        const calculatedPositions = new Map<string, { x: number; y: number; level: number }>();
        const visited = new Set<string>();
        
        const calculatePositions = (address: string, level: number, parentX: number, siblingIndex: number, totalSiblings: number) => {
            if (visited.has(address)) return;
            visited.add(address);

            const levelHeight = 300;
            const y = 100 + level * levelHeight;
            
            const minSpacing = 250;
            const spreadWidth = Math.max(1200, minSpacing * totalSiblings);
            const x = parentX + (siblingIndex - (totalSiblings - 1) / 2) * (spreadWidth / Math.max(totalSiblings, 1));

            calculatedPositions.set(address, { x, y, level });

            const children = childrenMap.get(address) || [];
            children.forEach((childAddress, index) => {
                calculatePositions(childAddress, level + 1, x, index, children.length);
            });
        };

        calculatePositions(graphData.root, 0, 600, 0, 1);

        const layoutNodes: Node[] = graphData.nodes.map(node => {
            const pos = calculatedPositions.get(node.address) || { x: 600, y: 400, level: 0 };
            const isRoot = node.address === graphData.root;
            
            // Find incoming edge for this node
            const incomingEdge = graphData.edges.find(edge => edge.to === node.address);
            
            // Use utility functions to get display name and subtitle
            const label = getNodeDisplayName(node, incomingEdge, isRoot);
            const subtitle = getNodeSubtitle(node, incomingEdge, isRoot);
            
            return {
                id: node.address,
                label,
                subtitle,
                type: isRoot ? "root" : node.type,
                risk: node.riskScore,
                x: pos.x,
                y: pos.y,
            };
        });

        const layoutEdges: Edge[] = graphData.edges.map(edge => ({
            from: edge.from,
            to: edge.to,
        }));

        return { initialNodes: layoutNodes, edges: layoutEdges };
    }, [graphData]);

    useEffect(() => {
        const positions = new Map<string, { x: number; y: number }>();
        initialNodes.forEach(node => {
            positions.set(node.id, { x: node.x, y: node.y });
        });
        setNodePositions(positions);
    }, [initialNodes]);

    const nodes = useMemo(() => {
        return initialNodes.map(node => ({
            ...node,
            ...(nodePositions.get(node.id) || { x: node.x, y: node.y })
        }));
    }, [initialNodes, nodePositions]);

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

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 0 && !draggedNode) {
            setIsPanning(true);
            panStartRef.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
        }
    }, [transform.x, transform.y, draggedNode]);

    const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        setDraggedNode(nodeId);
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            nodeX: node.x,
            nodeY: node.y,
        };
    }, [nodes]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isPanning && !draggedNode) {
            setTransform(prev => ({
                ...prev,
                x: e.clientX - panStartRef.current.x,
                y: e.clientY - panStartRef.current.y,
            }));
        } else if (draggedNode) {
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
            }
            
            rafIdRef.current = requestAnimationFrame(() => {
                const dx = (e.clientX - dragStartRef.current.x) / transform.scale;
                const dy = (e.clientY - dragStartRef.current.y) / transform.scale;

                setNodePositions(prev => {
                    const newPositions = new Map(prev);
                    newPositions.set(draggedNode, {
                        x: dragStartRef.current.nodeX + dx,
                        y: dragStartRef.current.nodeY + dy,
                    });
                    return newPositions;
                });
                
                rafIdRef.current = null;
            });
        }
    }, [isPanning, draggedNode, transform.scale]);

    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
        setDraggedNode(null);
        
        if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (isPanning || draggedNode) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
            return () => {
                window.removeEventListener("mousemove", handleMouseMove);
                window.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [isPanning, draggedNode, handleMouseMove, handleMouseUp]);

    const getNodeById = useCallback((id: string) => nodes.find(n => n.id === id), [nodes]);

    const handleResetZoom = useCallback(() => {
        setTransform({ x: 0, y: 0, scale: 1 });
    }, []);

    const handleZoomIn = useCallback(() => {
        setTransform(prev => ({ ...prev, scale: Math.min(prev.scale + 0.2, 3) }));
    }, []);

    const handleZoomOut = useCallback(() => {
        setTransform(prev => ({ ...prev, scale: Math.max(prev.scale - 0.2, 0.3) }));
    }, []);

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
    }, [edges, getNodeById]);

    if (!graphData) {
        return (
            <div className="flex flex-1 items-center justify-center bg-[#0a0a0a]">
                <div className="text-gray-400">No graph data available</div>
            </div>
        );
    }

    return (
        <div 
            ref={containerRef}
            className="flex flex-1 relative bg-[#0a0a0a] overflow-hidden select-none"
            style={{ cursor: isPanning ? 'grabbing' : draggedNode ? 'grabbing' : 'grab' }}
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
                                    stroke={isHighlighted ? "#C8FF3E" : "#2a2a2a"}
                                    strokeWidth={isHighlighted ? 2.5 : 1.5}
                                    fill="none"
                                    strokeDasharray={edge.fromNode.type === "root" || edge.toNode.type === "root" ? "0" : "4 4"}
                                />
                            );
                        })}
                    </g>

                    <g className="nodes">
                        {nodes.map((node) => {
                            const isHovered = hoveredNode === node.id;
                            const isRoot = node.type === "root";
                            const color = "#C8FF3E";
                            const width = isRoot ? 380 : 220;
                            const height = isRoot ? 80 : 60;

                            return (
                                <g
                                    key={node.id}
                                    transform={`translate(${node.x - width / 2}, ${node.y - height / 2})`}
                                    onMouseEnter={() => setHoveredNode(node.id)}
                                    onMouseLeave={() => setHoveredNode(null)}
                                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                                    onClick={() => {
                                        const fullNode = graphData.nodes.find(n => n.address === node.id);
                                        if (fullNode) {
                                            setSelectedNode(fullNode);
                                        }
                                    }}
                                    style={{ 
                                        cursor: draggedNode === node.id ? 'grabbing' : 'grab',
                                        willChange: draggedNode === node.id ? 'transform' : 'auto'
                                    }}
                                    filter={isHovered ? "url(#glow)" : undefined}
                                >
                                    <rect
                                        width={width}
                                        height={height}
                                        rx={4}
                                        fill="#0f0f0f"
                                        stroke={color}
                                        strokeWidth={isHovered ? 2.5 : 1.5}
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
                                        pointerEvents="none"
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
                                        pointerEvents="none"
                                    >
                                        {node.subtitle}
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

            <div className="absolute bottom-6 right-6 text-xs font-mono text-gray-500">
                <span>{nodes.length} nodes · {edges.length} edges · zoom: {(transform.scale * 100).toFixed(0)}%</span>
            </div>
        </div>
    );
};
