"use client";

type GlowColor = "amber" | "cyan" | "green" | "red" | "purple" | "none";

export function GlowCard({
  children,
  glow = "none",
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  glow?: GlowColor;
  className?: string;
  onClick?: () => void;
}) {
  const glowClasses: Record<GlowColor, string> = {
    amber:  "border-neon-amber/40 glow-amber",
    cyan:   "border-neon-cyan/40 glow-cyan",
    green:  "border-neon-green/40 glow-green",
    red:    "border-neon-red/40 glow-red",
    purple: "border-neon-purple/40 glow-purple",
    none:   "border-border-subtle",
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-bg-surface border rounded-lg
        transition-all duration-150
        ${glow !== "none" ? glowClasses[glow] : "border-border-subtle hover:border-neon-amber/20"}
        ${onClick ? "cursor-pointer hover:-translate-y-0.5" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
