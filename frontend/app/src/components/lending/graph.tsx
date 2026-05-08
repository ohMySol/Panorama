'use client'

import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

type ProtocolKind =
    | "stable"
    | "cdp"
    | "lend"
    | "lst"
    | "yield"
    | "rest"
    | "lrt"
    | "amm"
    | "perps"
    | "oracle"
    | "bridge"
    | "vault"
    | "lev";

type EdgeKind =
    | "dep"
    | "oracle"
    | "bridge"
    | "exploit"
    | "liquidity";

interface NodeData {
    id: string;
    label: string;
    kind: ProtocolKind;
    tvl: number;
    ring: number;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
}

interface EdgeData {
    from: NodeData;
    to: NodeData;
    w: number;
    kind: EdgeKind;
}

interface ProjectedNode {
    node: NodeData;
    sx: number;
    sy: number;
    zNorm: number;
    scale: number;
}

interface GraphData {
    nodes: NodeData[];
    edges: EdgeData[];
    byId: Record<string, NodeData>;
}

interface ArgusGraphProps {
    variant?: "hero" | "compact" | "dashboard";
    highlight?: string[];
    propagate?: [string, string][];
    critical?: string[];
    interactive?: boolean;
    focusNode?: string | null;
    onSelect?: (id: string) => void;
    showLabels?: boolean;
    intensity?: number;
    className?: string;
    style?: React.CSSProperties;
}

const PROTOCOLS: [
    string,
    string,
    ProtocolKind,
    number,
    number
][] = [
    ["ethena", "Ethena USDe", "stable", 3.2, 1],
    ["mkr", "Sky / MakerDAO", "cdp", 8.4, 0],
    ["aave", "Aave v3", "lend", 12.1, 0],
    ["morpho", "Morpho Blue", "lend", 4.8, 1],
    ["compound", "Compound v3", "lend", 2.4, 1],
    ["lido", "Lido stETH", "lst", 24.6, 0],
    ["chainlink", "Chainlink", "oracle", 5.2, 2],
];

const EDGES: [
    string,
    string,
    number,
    EdgeKind
][] = [
    ["ethena", "aave", 0.85, "dep"],
    ["ethena", "morpho", 0.7, "dep"],
    ["ethena", "compound", 0.6, "dep"],
    ["aave", "chainlink", 0.95, "oracle"],
    ["morpho", "chainlink", 0.9, "oracle"],
    ["compound", "chainlink", 0.85, "oracle"],
    ["mkr", "chainlink", 0.9, "oracle"],
    ["aave", "lido", 0.75, "liquidity"],
    ["morpho", "lido", 0.7, "liquidity"],
];

function mulberry32(a: number) {
    return function () {
        let t = (a += 0x6D2B79F5);

        t = Math.imul(t ^ (t >>> 15), t | 1);

        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function buildGraph(seed = 1): GraphData {
    const rng = mulberry32(seed);

    const byId: Record<string, NodeData> = {};

    PROTOCOLS.forEach(
        ([id, label, kind, tvl, ring], i) => {
            const ringR = [110, 230, 360][ring];

            const angle =
                i * 137.50776 * (Math.PI / 180) +
                rng() * 0.4;

            const r =
                ringR + (rng() - 0.5) * 60;

            byId[id] = {
                id,
                label,
                kind,
                tvl,
                ring,
                x: Math.cos(angle) * r,
                y:
                    Math.sin(angle) *
                    r *
                    0.78,
                z: (rng() - 0.5) * 220,
                vx: 0,
                vy: 0,
            };
        }
    );

    const nodes = Object.values(byId);

    const edges: EdgeData[] = EDGES.map(
        ([a, b, w, kind]) => ({
            from: byId[a],
            to: byId[b],
            w,
            kind,
        })
    ).filter((e) => e.from && e.to);

    return {
        nodes,
        edges,
        byId,
    };
}

export const ArgusGraph: React.FC<
    ArgusGraphProps
> = ({
         variant = "hero",
         highlight = [
             "ethena",
             "aave",
             "morpho",
         ],
         propagate = [
             ["ethena", "aave"],
             ["aave", "morpho"],
         ],
         critical = [],
         interactive = true,
         focusNode = null,
         onSelect,
         showLabels = true,
         intensity = 1,
         className = "",
         style = {},
     }) => {
    const wrapRef =
        useRef<HTMLDivElement | null>(null);

    const canvasRef =
        useRef<HTMLCanvasElement | null>(null);

    const stateRef = useRef({
        g: buildGraph(7),
        t: 0,
        mouse: {
            x: 0,
            y: 0,
            has: false,
        },
        rot: 0,
    });

    const [hoverId, setHoverId] =
        useState<string | null>(null);

    const [size, setSize] = useState({
        w: 800,
        h: 600,
        dpr: 1,
    });

    useEffect(() => {
        if (!wrapRef.current) return;

        const el = wrapRef.current;

        const ro = new ResizeObserver(() => {
            const r =
                el.getBoundingClientRect();

            const dpr = Math.min(
                window.devicePixelRatio || 1,
                2
            );

            setSize({
                w: r.width,
                h: r.height,
                dpr,
            });
        });

        ro.observe(el);

        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        if (
            !interactive ||
            !wrapRef.current
        )
            return;

        const el = wrapRef.current;

        const onMove = (
            e: MouseEvent
        ) => {
            const r =
                el.getBoundingClientRect();

            const x =
                (e.clientX - r.left) /
                r.width -
                0.5;

            const y =
                (e.clientY - r.top) /
                r.height -
                0.5;

            stateRef.current.mouse = {
                x,
                y,
                has: true,
            };
        };

        const onLeave = () => {
            stateRef.current.mouse = {
                x: 0,
                y: 0,
                has: false,
            };
        };

        el.addEventListener(
            "mousemove",
            onMove
        );

        el.addEventListener(
            "mouseleave",
            onLeave
        );

        return () => {
            el.removeEventListener(
                "mousemove",
                onMove
            );

            el.removeEventListener(
                "mouseleave",
                onLeave
            );
        };
    }, [interactive]);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        let raf = 0;

        let last = performance.now();

        const draw = (now: number) => {
            const dt =
                Math.min(48, now - last) /
                1000;

            last = now;

            const s = stateRef.current;

            s.t += dt;

            s.rot += dt * 0.02;

            const {
                w,
                h,
                dpr,
            } = size;

            canvas.width = w * dpr;
            canvas.height = h * dpr;

            ctx.setTransform(
                dpr,
                0,
                0,
                dpr,
                0,
                0
            );

            ctx.clearRect(0, 0, w, h);

            const cx = w / 2;
            const cy = h / 2;

            const cosR = Math.cos(s.rot);
            const sinR = Math.sin(s.rot);

            const projected: ProjectedNode[] =
                s.g.nodes.map((n) => {
                    const rx =
                        n.x * cosR -
                        n.y * sinR;

                    const ry =
                        n.x * sinR +
                        n.y * cosR;

                    const zNorm =
                        (n.z + 220) / 440;

                    const scale =
                        0.65 + zNorm * 0.55;

                    return {
                        node: n,
                        sx:
                            cx +
                            rx * scale,
                        sy:
                            cy +
                            ry * scale,
                        zNorm,
                        scale,
                    };
                });

            const idx: Record<
                string,
                ProjectedNode
            > = {};

            projected.forEach((p) => {
                idx[p.node.id] = p;
            });

            // edges
            s.g.edges.forEach((e) => {
                const a =
                    idx[e.from.id];

                const b = idx[e.to.id];

                if (!a || !b) return;

                ctx.strokeStyle =
                    "rgba(255,255,255,0.08)";

                ctx.lineWidth = 0.8;

                ctx.beginPath();

                ctx.moveTo(a.sx, a.sy);

                ctx.lineTo(b.sx, b.sy);

                ctx.stroke();
            });

            // nodes
            projected.forEach((p) => {
                const isHi =
                    highlight.includes(
                        p.node.id
                    );

                const isCrit =
                    critical.includes(
                        p.node.id
                    );

                const r =
                    [4.6, 3, 2][
                        p.node.ring
                        ] * intensity;

                // glow
                if (isHi || isCrit) {
                    const grad =
                        ctx.createRadialGradient(
                            p.sx,
                            p.sy,
                            0,
                            p.sx,
                            p.sy,
                            r * 8
                        );

                    grad.addColorStop(
                        0,
                        isCrit
                            ? "rgba(255,90,90,0.35)"
                            : "rgba(214,255,52,0.28)"
                    );

                    grad.addColorStop(
                        1,
                        "rgba(0,0,0,0)"
                    );

                    ctx.fillStyle = grad;

                    ctx.beginPath();

                    ctx.arc(
                        p.sx,
                        p.sy,
                        r * 8,
                        0,
                        Math.PI * 2
                    );

                    ctx.fill();
                }

                ctx.fillStyle = isCrit
                    ? "#FF5A5A"
                    : isHi
                        ? "#с8ff3e"
                        : "rgba(180,190,205,0.7)";

                ctx.beginPath();

                ctx.arc(
                    p.sx,
                    p.sy,
                    r,
                    0,
                    Math.PI * 2
                );

                ctx.fill();

                if (showLabels) {
                    ctx.font =
                        '10px "Geist Mono"';

                    ctx.fillStyle =
                        isHi
                            ? "#C8F3EE"
                            : "#8B949E";

                    ctx.fillText(
                        p.node.label.toUpperCase(),
                        p.sx + 10,
                        p.sy + 3
                    );
                }
            });

            raf =
                requestAnimationFrame(draw);
        };

        raf = requestAnimationFrame(draw);

        return () =>
            cancelAnimationFrame(raf);
    }, [
        size,
        highlight,
        critical,
        showLabels,
        intensity,
    ]);

    const handleClick = useCallback(() => {
        if (!onSelect || !hoverId)
            return;

        onSelect(hoverId);
    }, [onSelect, hoverId]);

    return (
        <div
            ref={wrapRef}
            className={`relative ${className}`}
            style={{
                cursor: hoverId
                    ? "pointer"
                    : "default",
                ...style,
            }}
            onClick={handleClick}
        >
            <canvas
                ref={canvasRef}
                className="w-full h-full block"
            />
        </div>
    );
};