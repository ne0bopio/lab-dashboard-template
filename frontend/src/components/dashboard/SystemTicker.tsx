"use client";

export function SystemTicker({ logs }: { logs: string[] }) {
  const doubled = [...logs, ...logs]; // seamless loop
  const text = doubled.map((l, i) => `▶ ${l}`).join("  ·  ");

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "#080b0f",
        border: "1px solid rgba(255,179,71,0.15)",
        height: 32,
        position: "relative",
      }}
    >
      <div className="absolute inset-y-0 left-0 w-8 z-10" style={{ background: "linear-gradient(to right, #080b0f, transparent)" }} />
      <div className="absolute inset-y-0 right-0 w-8 z-10" style={{ background: "linear-gradient(to left, #080b0f, transparent)" }} />
      <div
        className="flex items-center h-full"
        style={{
          animation: "ticker 60s linear infinite",
          whiteSpace: "nowrap",
          paddingLeft: "100%",
        }}
      >
        <span
          className="font-mono"
          style={{ fontSize: "0.65rem", color: "#ffb347", letterSpacing: "0.04em", opacity: 0.7 }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}
