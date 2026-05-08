'use client'

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface ArgusIntroProps {
    onDone?: () => void;
}

interface NodeType {
    tx: number;
    ty: number;
    x: number;
    y: number;
    delay: number;
    ring: number;
    cx?: number;
    cy?: number;
}

export const ArgusIntro: React.FC<ArgusIntroProps> = ({
                                                          onDone,
                                                      }) => {
    const [phase, setPhase] = useState<number>(0);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const timers: ReturnType<typeof setTimeout>[] = [];

        timers.push(setTimeout(() => setPhase(1), 450));
        timers.push(setTimeout(() => setPhase(2), 1100));
        timers.push(setTimeout(() => setPhase(3), 2900));
        timers.push(setTimeout(() => setPhase(4), 3700));
        timers.push(setTimeout(() => setPhase(5), 4400));
        timers.push(setTimeout(() => setPhase(6), 6300));

        timers.push(
            setTimeout(() => {
                onDone?.();
            }, 7000)
        );

        return () => {
            timers.forEach(clearTimeout);
        };
    }, [onDone]);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        let raf = 0;

        const start = performance.now();

        const N = 56;

        const rng = (() => {
            let a = 9;

            return () => {
                let t = (a += 0x6d2b79f5);

                t = Math.imul(t ^ (t >>> 15), t | 1);

                t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            };
        })();

        const nodes: NodeType[] = Array.from(
            { length: N },
            (_, i) => {
                const angle =
                    (i / N) * Math.PI * 2 + rng() * 0.4;

                const r = 60 + rng() * 180;

                return {
                    tx: Math.cos(angle) * r,
                    ty: Math.sin(angle) * r * 0.78,
                    x: Math.cos(angle) * 800,
                    y: Math.sin(angle) * 800,
                    delay: rng() * 0.6,
                    ring: i % 6 === 0 ? 0 : 1,
                };
            }
        );

        const edges: [number, number, number][] = [];

        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                const dx = nodes[i].tx - nodes[j].tx;
                const dy = nodes[i].ty - nodes[j].ty;

                const d = Math.sqrt(dx * dx + dy * dy);

                if (d < 95) {
                    edges.push([i, j, d]);
                }
            }
        }

        const ease = (x: number) =>
            1 - Math.pow(1 - x, 3);

        const draw = (now: number) => {
            const t = (now - start) / 1000;

            const w = canvas.clientWidth;
            const h = canvas.clientHeight;

            const dpr = Math.min(
                window.devicePixelRatio || 1,
                2
            );

            canvas.width = w * dpr;
            canvas.height = h * dpr;

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            ctx.clearRect(0, 0, w, h);

            const cx = w / 2;
            const cy = h / 2;

            const formP = Math.max(
                0,
                Math.min(1, (t - 0.4) / 1.8)
            );

            const convP = Math.max(
                0,
                Math.min(1, (t - 2.5) / 1.2)
            );

            const collapse = Math.max(
                0,
                Math.min(1, (t - 2.6) / 1.0)
            );

            nodes.forEach((n) => {
                const local = ease(
                    Math.max(
                        0,
                        Math.min(1, formP - n.delay * 0.4)
                    )
                );

                const ax = n.x + (n.tx - n.x) * local;
                const ay = n.y + (n.ty - n.y) * local;

                const targetR =
                    28 * (1 - collapse);

                const ang = Math.atan2(n.ty, n.tx);

                const cxN = Math.cos(ang) * targetR;
                const cyN = Math.sin(ang) * targetR;

                n.cx = ax + (cxN - ax) * convP;
                n.cy = ay + (cyN - ay) * convP;
            });

            // edges
            edges.forEach(([i, j]) => {
                const a = nodes[i];
                const b = nodes[j];

                const localA = Math.max(
                    0,
                    Math.min(1, formP - a.delay * 0.4)
                );

                const localB = Math.max(
                    0,
                    Math.min(1, formP - b.delay * 0.4)
                );

                const alpha =
                    Math.min(localA, localB) *
                    (1 - convP) *
                    0.55 *
                    (1 - collapse);

                if (alpha < 0.02) return;

                ctx.strokeStyle = `rgba(214,255,52,${alpha})`;

                ctx.lineWidth = 0.6;

                ctx.beginPath();

                ctx.moveTo(
                    cx + (a.cx || 0),
                    cy + (a.cy || 0)
                );

                ctx.lineTo(
                    cx + (b.cx || 0),
                    cy + (b.cy || 0)
                );

                ctx.stroke();
            });

            // nodes
            nodes.forEach((n) => {
                const local = Math.max(
                    0,
                    Math.min(1, formP - n.delay * 0.4)
                );

                if (local < 0.02) return;

                const x = cx + (n.cx || 0);
                const y = cy + (n.cy || 0);

                const r =
                    (n.ring === 0 ? 2.6 : 1.6) *
                    (1 - convP * 0.4) *
                    (1 - collapse * 0.8);

                ctx.fillStyle = `rgba(214,255,52,${
                    (0.4 + local * 0.55) *
                    (1 - collapse)
                })`;

                ctx.beginPath();

                ctx.arc(x, y, r, 0, Math.PI * 2);

                ctx.fill();
            });

            // central glow
            if (t < 1.5) {
                const a = Math.max(
                    0,
                    Math.min(1, t / 0.4)
                );

                const grad =
                    ctx.createRadialGradient(
                        cx,
                        cy,
                        0,
                        cx,
                        cy,
                        120
                    );

                grad.addColorStop(
                    0,
                    `rgba(214,255,52,${
                        a * 0.18
                    })`
                );

                grad.addColorStop(
                    1,
                    "rgba(0,0,0,0)"
                );

                ctx.fillStyle = grad;

                ctx.beginPath();

                ctx.arc(
                    cx,
                    cy,
                    120,
                    0,
                    Math.PI * 2
                );

                ctx.fill();
            }

            raf = requestAnimationFrame(draw);
        };

        raf = requestAnimationFrame(draw);

        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{
                background: "#050505",
                opacity: phase >= 6 ? 0 : 1,
                pointerEvents:
                    phase >= 6 ? "none" : "auto",
                transition:
                    "opacity 0.9s ease-out",
            }}
        >
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{
                    opacity: phase <= 3 ? 1 : 0,
                    transform: `scale(${
                        phase <= 2
                            ? 1
                            : phase === 3
                                ? 0.82
                                : 0.78
                    })`,
                    filter: `blur(${
                        phase >= 3 ? 8 : 0
                    }px)`,
                    transition:
                        "opacity 1.2s ease, transform 1.4s cubic-bezier(0.22,1,0.36,1), filter 1.2s ease",
                }}
            />

            <div
                className="relative flex flex-col items-center"
                style={{
                    opacity: phase >= 3 ? 1 : 0,
                    transform: `
                        scale(${phase >= 3 ? 1 : 0.86})
                        translateY(${phase >= 3 ? 0 : 12}px)
                    `,
                    filter: `
                        blur(${phase >= 3 ? 0 : 8}px)
                    `,
                    transition:
                        "opacity 1.1s cubic-bezier(0.22,1,0.36,1), transform 1.4s cubic-bezier(0.22,1,0.36,1), filter 1.1s ease",
                }}
            >
                <div
                    className="absolute"
                    style={{
                        width: 180,
                        height: 180,
                        borderRadius: "9999px",
                        background:
                            "radial-gradient(circle, rgba(214,255,52,0.18) 0%, rgba(214,255,52,0.08) 35%, transparent 75%)",
                        filter: "blur(28px)",
                        zIndex: -1,
                        opacity: phase >= 3 ? 1 : 0,
                        transition:
                            "opacity 1.4s ease",
                    }}
                />

                <Image
                    width={200}
                    height={200}
                    alt="argus-logo"
                    src="/argus-logo.svg"
                    style={{
                        filter:
                            "drop-shadow(0 0 14px rgba(214,255,52,0.22))",
                    }}
                />

                <div
                    style={{
                        marginTop: 28,
                        fontWeight: 600,
                        fontSize: 50,
                        letterSpacing: "0.12em",
                        color: "#E6EDF3",
                        opacity: phase >= 4 ? 1 : 0,
                        transform: `translateY(${
                            phase >= 4 ? 0 : 6
                        }px)`,
                        transition:
                            "opacity 0.8s ease, transform 0.8s ease",
                    }}
                    className="font-display"
                >
                    PANORAMA
                </div>

            </div>
        </div>
    );
};