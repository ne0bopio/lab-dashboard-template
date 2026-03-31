"use client";
import { useState, useEffect, useRef, useCallback } from "react";

interface TransitionEvent {
  id: string;
  title: string;
  fromColor: string;
  toColor: string;
  fromX: number; fromY: number;
  toX: number; toY: number;
  startedAt: number;
}

const DURATION = 1800;

export function useStageTransition() {
  const [transition, setTransition] = useState<TransitionEvent | null>(null);
  const trigger = useCallback((event: Omit<TransitionEvent, "startedAt">) => {
    setTransition({ ...event, startedAt: Date.now() });
  }, []);
  const clear = useCallback(() => setTransition(null), []);
  return { transition, trigger, clear };
}

interface Star { x: number; y: number; z: number; }
interface Spark { x: number; y: number; vx: number; vy: number; life: number; size: number; color: string; }

export function StageTransitionOverlay({ transition, onComplete }: { transition: TransitionEvent | null; onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!transition) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Hyperspace stars
    const stars: Star[] = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: (Math.random() - 0.5) * canvas.width * 2,
        y: (Math.random() - 0.5) * canvas.height * 2,
        z: Math.random() * 1000,
      });
    }

    // Destination burst sparks
    const sparks: Spark[] = [];
    let burstFired = false;

    // Center point for hyperspace
    const cx = (transition.fromX + transition.toX) / 2;
    const cy = (transition.fromY + transition.toY) / 2;

    const completeTimer = setTimeout(onComplete, DURATION);

    function draw() {
      if (!ctx || !canvas || !transition) return;
      const elapsed = Date.now() - transition.startedAt;
      const p = Math.min(elapsed / DURATION, 1);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ── PHASE 1: Hyperspace warp (0-60%) ──
      if (p < 0.65) {
        const warpIntensity = Math.min(p / 0.3, 1);
        const speed = 8 + warpIntensity * 40;

        ctx.save();
        ctx.translate(cx, cy);

        stars.forEach(star => {
          star.z -= speed;
          if (star.z <= 0) star.z = 1000;

          const sx = (star.x / star.z) * 300;
          const sy = (star.y / star.z) * 300;
          const prevZ = star.z + speed;
          const px = (star.x / prevZ) * 300;
          const py = (star.y / prevZ) * 300;

          const brightness = Math.min(1, (1000 - star.z) / 600);
          const streakLen = warpIntensity;

          // Star streak
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(
            px + (sx - px) * streakLen,
            py + (sy - py) * streakLen
          );

          const alpha = brightness * warpIntensity;
          // Color blend from white to stage colors
          const useColor = Math.random() > 0.7
            ? transition.toColor
            : Math.random() > 0.5
              ? transition.fromColor
              : `rgba(255,255,255,${alpha})`;

          if (useColor.startsWith("rgba")) {
            ctx.strokeStyle = useColor;
          } else {
            ctx.strokeStyle = useColor + Math.floor(alpha * 255).toString(16).padStart(2, "0");
          }
          ctx.lineWidth = 1 + brightness * 2 * warpIntensity;
          ctx.stroke();

          // Dot at tip
          if (brightness > 0.5) {
            ctx.beginPath();
            ctx.arc(sx, sy, brightness * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${alpha * 0.8})`;
            ctx.fill();
          }
        });

        ctx.restore();

        // Central glow
        const glowR = 30 + warpIntensity * 80;
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
        grd.addColorStop(0, transition.toColor + "40");
        grd.addColorStop(0.5, transition.toColor + "15");
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.fillRect(cx - glowR, cy - glowR, glowR * 2, glowR * 2);
      }

      // ── PHASE 2: Flash + energy transfer (55-80%) ──
      if (p > 0.5 && p < 0.8) {
        const flashP = (p - 0.5) / 0.3;

        // Energy beam from source to destination
        const beamP = Math.min(flashP * 1.5, 1);
        const bx = transition.fromX + (transition.toX - transition.fromX) * beamP;
        const by = transition.fromY + (transition.toY - transition.fromY) * beamP;

        // Thick glowing beam
        for (let w = 3; w >= 0; w--) {
          ctx.beginPath();
          ctx.moveTo(transition.fromX, transition.fromY);
          ctx.lineTo(bx, by);
          const bGrad = ctx.createLinearGradient(transition.fromX, transition.fromY, bx, by);
          const beamAlpha = (1 - flashP * 0.5) * (w === 0 ? 1 : 0.3);
          bGrad.addColorStop(0, transition.fromColor + Math.floor(beamAlpha * 100).toString(16).padStart(2, "0"));
          bGrad.addColorStop(1, transition.toColor + Math.floor(beamAlpha * 200).toString(16).padStart(2, "0"));
          ctx.strokeStyle = bGrad;
          ctx.lineWidth = w === 0 ? 3 : 8 + w * 6;
          ctx.stroke();
        }

        // Orb at beam tip
        const orbSize = 12 + Math.sin(elapsed * 0.03) * 4;
        const orbGrd = ctx.createRadialGradient(bx, by, 0, bx, by, orbSize);
        orbGrd.addColorStop(0, "rgba(255,255,255,0.9)");
        orbGrd.addColorStop(0.3, transition.toColor + "cc");
        orbGrd.addColorStop(1, "transparent");
        ctx.fillStyle = orbGrd;
        ctx.beginPath();
        ctx.arc(bx, by, orbSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── PHASE 3: Destination explosion (75-100%) ──
      if (p > 0.7) {
        // Fire burst once
        if (!burstFired) {
          burstFired = true;
          for (let i = 0; i < 40; i++) {
            const angle = (i / 40) * Math.PI * 2 + Math.random() * 0.3;
            const speed = 3 + Math.random() * 10;
            sparks.push({
              x: transition.toX,
              y: transition.toY,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 1,
              size: 1 + Math.random() * 4,
              color: Math.random() > 0.3 ? transition.toColor : "#ffffff",
            });
          }
        }

        // Draw sparks
        sparks.forEach(s => {
          if (s.life <= 0) return;
          s.x += s.vx;
          s.y += s.vy;
          s.vx *= 0.95;
          s.vy *= 0.95;
          s.life -= 0.03;

          const a = Math.max(0, s.life);

          // Spark trail
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x - s.vx * 4, s.y - s.vy * 4);
          ctx.strokeStyle = s.color + Math.floor(a * 180).toString(16).padStart(2, "0");
          ctx.lineWidth = s.size * a;
          ctx.stroke();

          // Spark dot
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * a, 0, Math.PI * 2);
          ctx.fillStyle = s.color + Math.floor(a * 255).toString(16).padStart(2, "0");
          ctx.fill();
        });

        // Shockwave ring
        const ringP = (p - 0.7) / 0.3;
        const ringR = ringP * 120;
        ctx.beginPath();
        ctx.arc(transition.toX, transition.toY, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = transition.toColor + Math.floor((1 - ringP) * 120).toString(16).padStart(2, "0");
        ctx.lineWidth = 2 + (1 - ringP) * 4;
        ctx.stroke();

        // Inner glow
        if (ringP < 0.5) {
          const igR = 40 * (1 - ringP * 2);
          const igGrd = ctx.createRadialGradient(transition.toX, transition.toY, 0, transition.toX, transition.toY, igR);
          igGrd.addColorStop(0, "rgba(255,255,255," + (1 - ringP * 2) * 0.6 + ")");
          igGrd.addColorStop(1, "transparent");
          ctx.fillStyle = igGrd;
          ctx.fillRect(transition.toX - igR, transition.toY - igR, igR * 2, igR * 2);
        }
      }

      // ── White flash at transition midpoint ──
      if (p > 0.48 && p < 0.55) {
        const flashA = 1 - Math.abs((p - 0.515) / 0.035);
        ctx.fillStyle = `rgba(255,255,255,${flashA * 0.15})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (p < 1) frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameRef.current);
      clearTimeout(completeTimer);
    };
  }, [transition, onComplete]);

  if (!transition) return null;

  const elapsed = Date.now() - transition.startedAt;
  const p = Math.min(elapsed / DURATION, 1);

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Title card — appears during beam phase */}
      <div
        className="absolute font-mono font-bold text-center"
        style={{
          left: "50%",
          top: "45%",
          transform: "translate(-50%, -50%)",
          color: "white",
          fontSize: "0.85rem",
          letterSpacing: "0.15em",
          textShadow: `0 0 20px ${transition.toColor}, 0 0 40px ${transition.toColor}60, 0 0 80px ${transition.toColor}30`,
          opacity: 0,
          animation: "title-flash 1.8s ease-out forwards",
        }}
      >
        <div style={{ fontSize: "0.5rem", color: transition.toColor, letterSpacing: "0.2em", marginBottom: 6, opacity: 0.8 }}>
          ▲ ADVANCING TO
        </div>
        {transition.title}
      </div>

      <style>{`
        @keyframes title-flash {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          30% { opacity: 0; }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
          70% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          90% { opacity: 0.5; }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  );
}
