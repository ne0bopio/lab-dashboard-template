"use client";
import { useState, useEffect } from "react";

export function CRTBoot() {
  // Start with false to match server render (nothing rendered)
  // Then show on client if not already booted
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // Skip if already shown this session
    if (sessionStorage.getItem("crt-booted")) {
      return;
    }

    // Show the boot sequence
    setVisible(true);

    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 1200);
    const t3 = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem("crt-booted", "1");
    }, 1600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: "#080b0f",
        opacity: phase === 2 ? 0 : 1,
        transition: phase === 2 ? "opacity 0.4s ease-out" : "none",
        pointerEvents: "none",
      }}
    >
      {/* Scan line wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,179,71,0.03) 2px, rgba(255,179,71,0.03) 4px)",
          animation: phase === 0 ? "flicker 0.3s ease-out" : "none",
        }}
      />

      {/* Boot text */}
      {phase >= 1 && (
        <div
          className="text-center"
          style={{ animation: "fadeInSlide 0.3s ease-out" }}
        >
          <div
            style={{
              fontFamily: "Orbitron, monospace",
              fontSize: "1.5rem",
              fontWeight: 900,
              color: "#ffb347",
              letterSpacing: "0.1em",
              textShadow: "0 0 20px rgba(255,179,71,0.8)",
            }}
          >
            ⚡ THE LAB
          </div>
          <div
            className="font-mono mt-2"
            style={{
              color: "#39ff14",
              fontSize: "0.7rem",
              letterSpacing: "0.2em",
            }}
          >
            SYSTEM INITIALIZING...
          </div>
          <div className="flex justify-center gap-1 mt-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  background: "#ffb347",
                  animation: `pulse 1s ease-in-out ${i * 0.15}s infinite`,
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
