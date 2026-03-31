"use client";

export function SkeletonCard({ className = "", lines = 3 }: { className?: string; lines?: number }) {
  return (
    <div
      className={`rounded-lg p-3 flex flex-col gap-2 ${className}`}
      style={{ background: "#0d1117", border: "1px solid #1e2d3d" }}
    >
      {/* Title bar */}
      <div className="flex items-center justify-between">
        <div className="h-3 rounded shimmer" style={{ width: "40%" }} />
        <div className="h-3 rounded shimmer" style={{ width: "15%" }} />
      </div>
      {/* Content lines */}
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-2.5 rounded shimmer"
          style={{ width: `${65 + Math.random() * 30}%`, animationDelay: `${i * 0.1}s` }}
        />
      ))}
      {/* Sparkline placeholder */}
      <div className="h-7 rounded shimmer mt-1" style={{ width: "100%" }} />
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="rounded-lg p-4" style={{ background: "#0d1117", border: "1px solid #1e2d3d" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="h-3 rounded shimmer" style={{ width: 120 }} />
        <div className="h-3 rounded shimmer" style={{ width: 60 }} />
      </div>
      <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonPanel({ height = 200 }: { height?: number }) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: "#0d1117", border: "1px solid #1e2d3d", minHeight: height }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 rounded shimmer" style={{ width: 100 }} />
        <div className="h-3 rounded shimmer" style={{ width: 40 }} />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-12 h-2.5 rounded shimmer" />
            <div className="flex-1 h-2.5 rounded shimmer" />
            <div className="w-8 h-2.5 rounded shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonKanban() {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 5 }).map((_, col) => (
        <div
          key={col}
          className="flex flex-col shrink-0 rounded-lg overflow-hidden"
          style={{ width: 240, background: "#0a0e14", border: "1px solid #1e2d3d18" }}
        >
          <div className="px-3 py-2.5" style={{ borderBottom: "2px solid #1e2d3d" }}>
            <div className="h-3 rounded shimmer" style={{ width: 80 }} />
          </div>
          <div className="p-2 flex flex-col gap-2">
            {Array.from({ length: 1 + Math.floor(Math.random() * 2) }).map((_, i) => (
              <div key={i} className="rounded-lg p-3" style={{ background: "#0d1117", border: "1px solid #1e2d3d" }}>
                <div className="h-3 rounded shimmer mb-2" style={{ width: "80%" }} />
                <div className="h-2 rounded shimmer" style={{ width: "60%" }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
