"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HelpCircle, X } from "lucide-react";

const SHORTCUTS = [
  { keys: "G D", desc: "Go to Dashboard" },
  { keys: "G I", desc: "Go to Ideas" },
  { keys: "N",   desc: "New Idea" },
  { keys: "?",   desc: "Show this help" },
  { keys: "ESC", desc: "Close modal/panel" },
];

export function KeyboardShortcuts() {
  const [showHelp, setShowHelp] = useState(false);
  const [lastKey, setLastKey]   = useState("");
  const router = useRouter();

  const handler = useCallback((e: KeyboardEvent) => {
    // Don't fire if typing in an input
    if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)) return;

    const key = e.key.toLowerCase();

    if (key === "escape") {
      setShowHelp(false);
      return;
    }
    if (key === "?") {
      e.preventDefault();
      setShowHelp(p => !p);
      return;
    }

    // Two-key combos: g+d, g+i
    if (lastKey === "g") {
      if (key === "d") { router.push("/"); setLastKey(""); return; }
      if (key === "i") { router.push("/ideas"); setLastKey(""); return; }
    }

    if (key === "g") { setLastKey("g"); setTimeout(() => setLastKey(""), 1000); return; }
    if (key === "n") {
      // Dispatch custom event for new idea modal
      window.dispatchEvent(new CustomEvent("lab-new-idea"));
      return;
    }

    setLastKey("");
  }, [lastKey, router]);

  useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handler]);

  return (
    <>
      {/* Help button */}
      <button
        onClick={() => setShowHelp(p => !p)}
        className="fixed bottom-10 right-3 z-50 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:opacity-80"
        style={{ background: "rgba(255,179,71,0.1)", color: "#445566", border: "1px solid #1e2d3d" }}
        title="Keyboard shortcuts"
      >
        <HelpCircle size={12} />
      </button>

      {/* Overlay */}
      {showHelp && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: "rgba(8,11,15,0.85)", backdropFilter: "blur(6px)" }}
          onClick={e => e.target === e.currentTarget && setShowHelp(false)}
        >
          <div
            className="w-80 rounded-xl p-5"
            style={{ background: "#0d1117", border: "1px solid rgba(255,179,71,0.3)", boxShadow: "0 0 30px rgba(255,179,71,0.1)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span
                style={{ fontFamily: "Orbitron, monospace", fontSize: "0.8rem", fontWeight: 700, color: "#ffb347", letterSpacing: "0.06em" }}
              >
                SHORTCUTS
              </span>
              <button onClick={() => setShowHelp(false)} style={{ color: "#445566" }}>
                <X size={14} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {SHORTCUTS.map(s => (
                <div key={s.keys} className="flex items-center justify-between">
                  <span className="font-mono" style={{ fontSize: "0.7rem", color: "#8899aa" }}>{s.desc}</span>
                  <div className="flex gap-1">
                    {s.keys.split(" ").map(k => (
                      <span
                        key={k}
                        className="px-1.5 py-0.5 rounded font-mono font-bold"
                        style={{ background: "rgba(255,179,71,0.1)", color: "#ffb347", border: "1px solid rgba(255,179,71,0.2)", fontSize: "0.6rem" }}
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
