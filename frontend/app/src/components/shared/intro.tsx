"use client"

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const R = 12;

const NODES = [
  { id: "root", x: 150, y: 40 },
  { id: "n1",   x: 60,  y: 110 },
  { id: "n2",   x: 150, y: 110 },
  { id: "n3",   x: 240, y: 110 },
  { id: "l1",   x: 30,  y: 180 },
  { id: "l2",   x: 90,  y: 180 },
  { id: "l3",   x: 120, y: 180 },
  { id: "l4",   x: 180, y: 180 },
  { id: "l5",   x: 210, y: 180 },
  { id: "l6",   x: 270, y: 180 },
];

const EDGES: [string, string][] = [
  ["root", "n1"],
  ["root", "n2"],
  ["root", "n3"],
  ["n1", "l1"],
  ["n1", "l2"],
  ["n2", "l3"],
  ["n2", "l4"],
  ["n3", "l5"],
  ["n3", "l6"],
];

const ORDER = ["root", "n1", "n2", "n3", "l1", "l2", "l3", "l4", "l5", "l6"];

export default function MerkleLoader() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  // Show loader on route change
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      setIsLoading(true);
      setIsFadingOut(false);
      
      const fadeTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, 2000);
      
      const hideTimer = setTimeout(() => {
        setIsLoading(false);
        prevPathname.current = pathname;
      }, 2500); // Fully hide after 2.5 seconds (500ms fade)
      
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [pathname]);

  // Hide loader after initial load
  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2000);
    
    const hideTimer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !isLoading) return;

    // Clear previous content
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

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

    // Draw edges with rounded corners (orthogonal lines)
    EDGES.forEach(([a, b]) => {
      const na = NODES.find((n) => n.id === a)!;
      const nb = NODES.find((n) => n.id === b)!;
      
      // Create path with rounded corners
      const midY = (na.y + nb.y) / 2;
      const radius = 8; // Corner radius
      
      let path: string;
      
      if (na.x === nb.x) {
        // Vertical line (straight down)
        path = `M ${na.x} ${na.y} L ${nb.x} ${nb.y}`;
      } else if (na.x < nb.x) {
        // Going right
        path = `M ${na.x} ${na.y} 
                L ${na.x} ${midY - radius} 
                Q ${na.x} ${midY} ${na.x + radius} ${midY}
                L ${nb.x - radius} ${midY}
                Q ${nb.x} ${midY} ${nb.x} ${midY + radius}
                L ${nb.x} ${nb.y}`;
      } else {
        // Going left
        path = `M ${na.x} ${na.y} 
                L ${na.x} ${midY - radius} 
                Q ${na.x} ${midY} ${na.x - radius} ${midY}
                L ${nb.x + radius} ${midY}
                Q ${nb.x} ${midY} ${nb.x} ${midY + radius}
                L ${nb.x} ${nb.y}`;
      }
      
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
      nodeEls[id].setAttribute("fill", "#C8FF3E");
      
      // Light up connected edges
      EDGES.forEach(([a, b]) => {
        if ((a === id && lit.has(b)) || (b === id && lit.has(a))) {
          edgeEls[`${a}-${b}`].setAttribute("stroke", "#C8FF3E");
        }
      });
      
      lit.add(id);
    }

    function runCycle() {
      timers.forEach(clearTimeout);
      timers.length = 0;

      ORDER.forEach((id, i) => {
        timers.push(setTimeout(() => lightNode(id), i * 150));
      });
    }

    // Run only one cycle for the loader
    runCycle();

    return () => timers.forEach(clearTimeout);
  }, [isLoading]);

  // Don't render if loading is complete
  if (!isLoading) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 w-screen h-screen flex items-center justify-center bg-[#0d0d0d] transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 300 220"
        className="w-full max-w-xs"
        xmlns="http://www.w3.org/2000/svg"
      />
    </div>
  );
}
