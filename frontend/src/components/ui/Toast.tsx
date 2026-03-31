"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  persistent: boolean;
}

const CONFIG: Record<ToastType, { border: string; text: string; icon: string; duration: number; persist: boolean }> = {
  success: { border: "#39ff14", text: "#39ff14", icon: "✓", duration: 3000, persist: false },
  error:   { border: "#ff2052", text: "#ff2052", icon: "✗", duration: 0,    persist: true  },
  warning: { border: "#ffb347", text: "#ffb347", icon: "⚠", duration: 5000, persist: false },
  info:    { border: "#00e5ff", text: "#00e5ff", icon: "ℹ", duration: 4000, persist: false },
};

let addToastFn: ((msg: string, type: ToastType) => void) | null = null;

export function toast(message: string, type: ToastType = "info") {
  addToastFn?.(message, type);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    addToastFn = (message, type) => {
      const cfg = CONFIG[type];
      const id = Date.now() + Math.random();
      setToasts(t => [...t.slice(-2), { id, message, type, persistent: cfg.persist }]);
      if (!cfg.persist) {
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), cfg.duration);
      }
    };
    return () => { addToastFn = null; };
  }, []);

  function dismiss(id: number) {
    setToasts(t => t.filter(x => x.id !== id));
  }

  return (
    <div className="fixed top-14 right-4 left-4 sm:left-auto z-[9999] flex flex-col items-center sm:items-end gap-2 pointer-events-none">
      {toasts.slice(-3).map(t => {
        const c = CONFIG[t.type];
        return (
          <div
            key={t.id}
            className="flex items-start gap-3 px-4 py-3 rounded-lg font-mono text-xs w-full sm:w-auto sm:max-w-xs pointer-events-auto"
            style={{
              background: "#0d1117",
              border: `1px solid ${c.border}`,
              boxShadow: `0 0 16px ${c.border}30`,
              color: "#e8eaed",
              fontSize: "0.72rem",
              animation: "toastIn 0.25s ease-out",
            }}
          >
            <span style={{ color: c.text, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{c.icon}</span>
            <span className="flex-1 min-w-0">{t.message}</span>
            {t.persistent && (
              <button onClick={() => dismiss(t.id)} className="shrink-0 mt-0.5 opacity-50 hover:opacity-100 transition-opacity" style={{ color: c.text }}>
                <X size={12} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
