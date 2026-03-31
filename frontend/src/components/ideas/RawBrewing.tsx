"use client";
import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Particle {
  id: string;
  title: string;
  fullTitle: string;
  priority: string;
  tags: string[];
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  pulse: number;
}

interface RawBrewingProps {
  ideas: any[];
  onExpand: () => void;
}

export function RawBrewing({ ideas, onExpand }: RawBrewingProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: -100, y: -100 });
  const hoveredRef = useRef<string | null>(null);

  const initParticles = useCallback((w: number, h: number) => {
    particlesRef.current = ideas.map((idea) => ({
      id: idea.id,
      title: idea.title.length > 20 ? idea.title.slice(0, 18) + "…" : idea.title,
      fullTitle: idea.title,
      priority: idea.priority || "medium",
      tags: idea.tags?.slice(0, 2) || [],
      x: Math.random() * (w - 60) + 30,
      y: Math.random() * (h - 60) + 30,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.25 - 0.1,
      size: 4 + Math.random() * 3,
      opacity: 0.4 + Math.random() * 0.4,
      pulse: Math.random() * Math.PI * 2,
    }));
  }, [ideas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    initParticles(w, h);

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      const particles = particlesRef.current;
      const time = Date.now() / 1000;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Find hovered particle (inside draw loop — no React state needed)
      let hovId: string | null = null;
      let hovParticle: Particle | undefined = undefined;
      let minDist = 22;
      for (const p of particles) {
        const dist = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
        if (dist < minDist) {
          minDist = dist;
          hovId = p.id;
          hovParticle = p;
        }
      }
      hoveredRef.current = hovId;

      // Update cursor
      if (canvas) canvas.style.cursor = hovId ? "pointer" : "default";

      // Connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 179, 71, ${(1 - dist / 80) * 0.1})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.02;

        if (p.x < 12 || p.x > w - 12) p.vx *= -1;
        if (p.y < 12 || p.y > h - 12) { p.vy *= -1; p.y = Math.max(12, Math.min(h - 12, p.y)); }

        p.vx += (Math.random() - 0.5) * 0.015;
        p.vy += (Math.random() - 0.5) * 0.015;
        p.vx = Math.max(-0.5, Math.min(0.5, p.vx));
        p.vy = Math.max(-0.4, Math.min(0.4, p.vy));

        const pulseSize = p.size + Math.sin(p.pulse) * 1.2;
        const isHov = p.id === hovId;

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, pulseSize + (isHov ? 12 : 6), 0, Math.PI * 2);
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, pulseSize + (isHov ? 12 : 6));
        glow.addColorStop(0, `rgba(255, 179, 71, ${isHov ? 0.25 : 0.05})`);
        glow.addColorStop(1, "rgba(255, 179, 71, 0)");
        ctx.fillStyle = glow;
        ctx.fill();

        // Dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, isHov ? pulseSize + 2 : pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = isHov
          ? "rgba(255, 179, 71, 1)"
          : `rgba(255, 179, 71, ${p.opacity * (0.6 + Math.sin(p.pulse) * 0.3)})`;
        ctx.fill();

        // Fading labels (non-hovered, cycle visibility)
        if (!isHov && Math.sin(time * 0.8 + p.pulse) > 0.7) {
          ctx.font = '400 8px "JetBrains Mono", monospace';
          ctx.fillStyle = `rgba(255, 179, 71, ${0.2 + Math.sin(time + p.pulse) * 0.1})`;
          ctx.fillText(p.title, p.x + pulseSize + 5, p.y + 3);
        }
      });

      // Hovered tooltip — drawn on canvas (no DOM, no glitch)
      if (hovParticle) {
        const hp = hovParticle;
        const tx = Math.min(hp.x + 16, w - 140);
        const ty = Math.max(hp.y - 24, 14);

        // Tooltip bg
        ctx.fillStyle = "rgba(17, 24, 32, 0.95)";
        ctx.strokeStyle = "rgba(255, 179, 71, 0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(tx, ty, 130, 36, 5);
        ctx.fill();
        ctx.stroke();

        // Title
        ctx.font = '600 9px "JetBrains Mono", monospace';
        ctx.fillStyle = "#ffb347";
        ctx.fillText(hp.title, tx + 6, ty + 13);

        // Meta
        ctx.font = '400 7px "JetBrains Mono", monospace';
        ctx.fillStyle = "#445566";
        const meta = hp.priority.toUpperCase() + (hp.tags.length ? " · " + hp.tags.map(t => "#" + t).join(" ") : "");
        ctx.fillText(meta.slice(0, 28), tx + 6, ty + 26);
      }

      // Ambient bubbles
      for (let i = 0; i < 4; i++) {
        const bx = 15 + (i * w / 4) + Math.sin(time * 0.4 + i * 1.5) * 8;
        const by = h - ((time * 12 + i * 50) % h);
        ctx.beginPath();
        ctx.arc(bx, by, 1 + Math.sin(time + i) * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 179, 71, ${0.06 + Math.sin(time + i) * 0.03})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [ideas, initParticles]);

  // Mouse tracking — just update ref, no state
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseLeave = () => {
    mouseRef.current = { x: -100, y: -100 };
  };

  const handleClick = () => {
    if (hoveredRef.current) {
      router.push(`/ideas/${hoveredRef.current}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 relative" style={{ minHeight: 200 }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        />
      </div>

      {/* Bottom bar */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderTop: "1px solid rgba(255,179,71,0.1)", background: "#0a0e14" }}
      >
        <span className="font-mono" style={{ fontSize: "0.55rem", color: "#445566", letterSpacing: "0.08em" }}>
          {ideas.length} IDEAS BREWING
        </span>
        <button
          onClick={onExpand}
          className="font-mono transition-all hover:opacity-80"
          style={{
            fontSize: "0.55rem",
            color: "#ffb347",
            background: "rgba(255,179,71,0.08)",
            border: "1px solid rgba(255,179,71,0.2)",
            padding: "2px 8px",
            borderRadius: 4,
            letterSpacing: "0.06em",
            cursor: "pointer",
          }}
        >
          EXPAND LIST →
        </button>
      </div>
    </div>
  );
}
