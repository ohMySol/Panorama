"use client"

import { useEffect, useRef, useState } from "react";

const R = 12;

const NODES = [
  { id: "root", x: 150, y: 40 },
  { id: "n1",   x: 90,  y: 110 },
  { id: "n2",   x: 210, y: 110 },
  { id: "l1",   x: 60,  y: 180 },
  { id: "l2",   x: 120, y: 180 },
  { id: "l3",   x: 180, y: 180 },
  { id: "l4",   x: 240, y: 180 },
];

const EDGES: [string, string][] = [
  ["root", "n1"],
  ["root", "n2"],
  ["n1", "l1"],
  ["n1", "l2"],
  ["n2", "l3"],
  ["n2", "l4"],
];

const ORDER = ["root", "n1", "n2", "l1", "l2", "l3", "l4"];

export default function MerkleLoader() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hide loader after animation completes (approximately 3 seconds)
    const hideTimer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(hideTimer);
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const NS = "http://www.w3.org/2000/svg";
    const nodeEls: Record<string, SVGCircleElement> = {};
    const edgeEls: Record<string, SVGPathElement> = {};
    const lit = new Set<string>();
    const timers: ReturnType<typeof setTimeout>[] = [];

    function mk<T extends SVGElement>(
      tag: string,
      attrs: Record<string, string | number>
    ): T {
      const el = document.createElementNS(NS, tag) as T;
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
      return el;
    }

    // Draw curved edges using quadratic Bezier curves
    EDGES.forEach(([a, b]) => {
      const na = NODES.find((n) => n.id === a)!;
      const nb = NODES.find((n) => n.id === b)!;
      
      // Calculate control point for curve (midpoint with offset)
      const midX = (na.x + nb.x) / 2;
      const midY = (na.y + nb.y) / 2;
      const offsetY = 20; // Curve depth
      
      const path = `M ${na.x} ${na.y} Q ${midX} ${midY - offsetY} ${nb.x} ${nb.y}`;
      
      const el = mk<SVGPathElement>("path", {
        d: path,
        stroke: "#202020",
        "stroke-width": "1.5",
        fill: "none",
      });
      el.style.transition = "stroke 0.6s ease";
      svg.appendChild(el);
      edgeEls[`${a}-${b}`] = el;
    });

    NODES.forEach((n) => {
      const el = mk<SVGCircleElement>("circle", {
        cx: n.x, cy: n.y, r: R,
        fill: "#161616",
      });
      el.style.transition = "fill 0.6s ease";
      svg.appendChild(el);
      nodeEls[n.id] = el;
    });

    function lightNode(id: string) {
      nodeEls[id].setAttribute("fill", "#ffb53e");
      
      // Light up connected edges
      EDGES.forEach(([a, b]) => {
        if ((a === id && lit.has(b)) || (b === id && lit.has(a))) {
          edgeEls[`${a}-${b}`].setAttribute("stroke", "#ffb53e");
        }
      });
      
      lit.add(id);
    }

    function runCycle() {
      timers.forEach(clearTimeout);
      timers.length = 0;

      ORDER.forEach((id, i) => {
        timers.push(setTimeout(() => lightNode(id), i * 180));
      });
    }

    // Run only one cycle for the loader
    runCycle();

    return () => timers.forEach(clearTimeout);
  }, []);

  // Don't render if loading is complete
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen flex items-center justify-center bg-[#0d0d0d] transition-opacity duration-500">
      <svg
        ref={svgRef}
        viewBox="0 0 300 220"
        className="w-full max-w-xs"
        xmlns="http://www.w3.org/2000/svg"
      />
    </div>
  );
}
