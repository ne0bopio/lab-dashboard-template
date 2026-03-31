"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// Color palette for ideas cycling through the forge
const IDEA_COLORS = [
  "#ff2d8a",  // design pink
  "#2979ff",  // dev blue
  "#bf5fff",  // purple
  "#00e5ff",  // cyan
  "#39ff14",  // green
  "#ffb347",  // amber
];

interface QueueIdea {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  blueprint?: any;
  priority?: string;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  size: number;
  color: string;
  type: "spark" | "ring" | "glyph";
  char?: string;
}

const GLYPHS = ["◈", "⟁", "◎", "⊕", "⊗", "⌬", "⎔", "⟐", "⬡", "◇"];

export function DesignQueue({ ideas }: { ideas: QueueIdea[] }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef<number>(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [focusedIdx, setFocusedIdx] = useState(0);

  // Rotate focused idea
  useEffect(() => {
    if (ideas.length === 0) return;
    const t = setInterval(() => {
      setFocusedIdx(i => (i + 1) % ideas.length);
    }, 3000);
    return () => clearInterval(t);
  }, [ideas.length]);

  // Canvas animation — forging/crystallizing effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    function spawnParticles(cx: number, cy: number, color: string, burst = false) {
      const count = burst ? 8 : 2;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = burst ? 1.5 + Math.random() * 3 : 0.3 + Math.random() * 0.8;
        const type = Math.random() > 0.85 ? "glyph" : Math.random() > 0.6 ? "ring" : "spark";
        particlesRef.current.push({
          x: cx + (Math.random() - 0.5) * 40,
          y: cy + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (burst ? 0 : 0.2),
          life: 1,
          size: type === "glyph" ? 10 : 1.5 + Math.random() * 3,
          color,
          type,
          char: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
        });
      }
    }

    function draw() {
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      timeRef.current += 0.02;
      const t = timeRef.current;

      if (!ctx) return;
      ctx.fillStyle = "rgba(8,11,15,0.25)";
      ctx.fillRect(0, 0, w, h);

      // Ambient circuit grid lines
      ctx.strokeStyle = "rgba(41,121,255,0.04)";
      ctx.lineWidth = 0.5;
      const gridSize = 28;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Forge core — pulsing orb in center
      const cx = w / 2;
      const cy = h * 0.38;
      const pulse = Math.sin(t * 2) * 0.3 + 0.7;
      const focusColor = IDEA_COLORS[focusedIdx % IDEA_COLORS.length];

      // Outer glow rings
      for (let r = 3; r >= 0; r--) {
        const ringR = 18 + r * 14 + pulse * 6;
        const alpha = (0.15 - r * 0.035) * pulse;
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = focusColor + Math.floor(alpha * 255).toString(16).padStart(2, "0");
        ctx.lineWidth = r === 0 ? 1.5 : 0.5;
        ctx.stroke();
      }

      // Core orb
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
      grd.addColorStop(0, "rgba(255,255,255,0.9)");
      grd.addColorStop(0.3, focusColor + "cc");
      grd.addColorStop(1, focusColor + "00");
      ctx.beginPath();
      ctx.arc(cx, cy, 22 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Orbiting data nodes
      const nodeCount = Math.min(ideas.length, 6);
      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2 + t * 0.4;
        const orbitR = 52 + Math.sin(t + i) * 4;
        const nx = cx + Math.cos(angle) * orbitR;
        const ny = cy + Math.sin(angle) * orbitR * 0.5;
        const nc = IDEA_COLORS[i % IDEA_COLORS.length];

        // Connection line to core
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = nc + "30";
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Node
        const isActive = i === focusedIdx % nodeCount;
        ctx.beginPath();
        ctx.arc(nx, ny, isActive ? 5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? nc : nc + "60";
        ctx.fill();

        if (isActive) {
          ctx.beginPath();
          ctx.arc(nx, ny, 8 + pulse * 3, 0, Math.PI * 2);
          ctx.strokeStyle = nc + "50";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Spawn ambient particles
      if (Math.random() > 0.6) {
        spawnParticles(cx, cy, focusColor);
      }
      // Burst on idea change
      if (Math.floor(t * 50) % 150 === 0) {
        spawnParticles(cx, cy, focusColor, true);
      }

      // Draw + update particles
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.015;
        p.life -= 0.018;
        const a = Math.max(0, p.life);

        if (p.type === "spark") {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 4, p.y - p.vy * 4);
          ctx.strokeStyle = p.color + Math.floor(a * 180).toString(16).padStart(2, "0");
          ctx.lineWidth = p.size * a;
          ctx.stroke();
        } else if (p.type === "ring") {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 + (1 - a) * 3), 0, Math.PI * 2);
          ctx.strokeStyle = p.color + Math.floor(a * 120).toString(16).padStart(2, "0");
          ctx.lineWidth = 0.5;
          ctx.stroke();
        } else if (p.type === "glyph") {
          ctx.font = `${p.size * a}px monospace`;
          ctx.fillStyle = p.color + Math.floor(a * 150).toString(16).padStart(2, "0");
          ctx.fillText(p.char || "◈", p.x, p.y);
        }
      });

      // Scan line effect
      const scanY = ((t * 40) % h);
      const scanGrd = ctx.createLinearGradient(0, scanY - 2, 0, scanY + 2);
      scanGrd.addColorStop(0, "transparent");
      scanGrd.addColorStop(0.5, focusColor + "15");
      scanGrd.addColorStop(1, "transparent");
      ctx.fillStyle = scanGrd;
      ctx.fillRect(0, scanY - 2, w, 4);

      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [focusedIdx, ideas.length]);

  if (ideas.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-8 gap-2 rounded-lg"
        style={{ border: "1px dashed #ff2d8a20", color: "#ff2d8a40" }}>
        <div className="font-mono text-xs" style={{ fontSize: "0.6rem", letterSpacing: "0.08em" }}>QUEUE EMPTY</div>
      </div>
    );
  }

  const focused = ideas[focusedIdx % ideas.length];
  const focusColor = IDEA_COLORS[focusedIdx % IDEA_COLORS.length];

  return (
    <div className="flex flex-col h-full">
      {/* Canvas forge animation */}
      <div className="relative rounded-lg overflow-hidden" style={{ height: 160, background: "#08080f" }}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        {/* Focused idea name over canvas */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-3 pointer-events-none">
          <div className="font-mono text-center px-3" style={{
            fontSize: "0.62rem",
            color: focusColor,
            textShadow: `0 0 10px ${focusColor}80`,
            letterSpacing: "0.06em",
            lineHeight: 1.4,
            maxWidth: "90%",
            opacity: 0.9,
          }}>
            {focused?.title}
          </div>
          <div className="font-mono mt-1 flex items-center gap-1.5">
            <span style={{ fontSize: "0.45rem", color: "#445566", letterSpacing: "0.1em" }}>
              FORGING {focusedIdx + 1}/{ideas.length}
            </span>
            <div className="flex gap-0.5">
              {ideas.map((_, i) => (
                <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: i === focusedIdx % ideas.length ? focusColor : "#1e2d3d", transition: "background 0.5s" }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ideas list */}
      <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-1.5 mt-1.5">
        {ideas.map((idea, i) => {
          const color = IDEA_COLORS[i % IDEA_COLORS.length];
          const isFocused = i === focusedIdx % ideas.length;
          const isHovered = hovered === idea.id;

          return (
            <button
              key={idea.id}
              onClick={() => { if (idea.id) window.location.href = `/ideas/${idea.id}`; }}
              onMouseEnter={() => { setHovered(idea.id); setFocusedIdx(i); }}
              onMouseLeave={() => setHovered(null)}
              className="text-left rounded-lg transition-all group"
              style={{
                padding: "10px 12px",
                background: isFocused ? `${color}08` : "#0a0e14",
                border: `1px solid ${isFocused ? color + "30" : "#1e2d3d"}`,
                borderLeft: `3px solid ${color}`,
                boxShadow: isFocused ? `0 0 12px ${color}15` : "none",
                transform: isFocused ? "translateX(2px)" : "none",
              }}
            >
              {/* Status */}
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="flex items-center gap-1">
                  {isFocused && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inset-0 rounded-full animate-ping" style={{ background: color, opacity: 0.5 }} />
                      <span className="relative block w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                    </span>
                  )}
                  {!isFocused && <span className="w-1.5 h-1.5 rounded-full" style={{ background: color + "50" }} />}
                </div>
                <span className="font-mono" style={{ fontSize: "0.48rem", color, letterSpacing: "0.1em", opacity: 0.8 }}>
                  {idea.blueprint?.product_type?.toUpperCase() || "QUEUED"}
                </span>
                {idea.priority === "high" || idea.priority === "critical" ? (
                  <span className="font-mono px-1 py-0.5 rounded" style={{ fontSize: "0.42rem", background: "#ff205215", color: "#ff2052", border: "1px solid #ff205225" }}>
                    HIGH
                  </span>
                ) : null}
              </div>

              {/* Title */}
              <div className="font-mono font-bold leading-tight" style={{ fontSize: "0.72rem", color: isFocused ? "#e8eaed" : "#8899aa", lineHeight: 1.35 }}>
                {idea.title}
              </div>

              {/* Description */}
              {idea.description && (
                <p className="mt-1 line-clamp-1" style={{ fontSize: "0.6rem", color: "#445566", fontFamily: "Inter, sans-serif", lineHeight: 1.4 }}>
                  {idea.description}
                </p>
              )}

              {/* Blueprint status pills */}
              {idea.blueprint && (
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="font-mono px-1.5 py-0.5 rounded flex items-center gap-1" style={{ fontSize: "0.48rem", background: "#ff2d8a10", color: "#ff2d8a80", border: "1px solid #ff2d8a20" }}>
                    🎨 Frida: <span style={{ color: "#ff2d8a" }}>{idea.blueprint.design_status || "awaiting"}</span>
                  </span>
                  <span className="font-mono px-1.5 py-0.5 rounded flex items-center gap-1" style={{ fontSize: "0.48rem", background: "#2979ff10", color: "#2979ff80", border: "1px solid #2979ff20" }}>
                    💻 Kirby: <span style={{ color: "#2979ff" }}>{idea.blueprint.dev_status || "awaiting"}</span>
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
