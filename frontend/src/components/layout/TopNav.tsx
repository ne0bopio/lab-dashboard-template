"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Settings, Bell } from "lucide-react";
import { MobileDrawer } from "./MobileDrawer";

const NAV_ITEMS = [
  { label: "DASHBOARD", href: "/" },
  { label: "IDEAS",     href: "/ideas" },
  { label: "AGENTS",   href: "/agents" },
  { label: "TOOLS",    href: "/tools" },
  { label: "DOCS",     href: "/docs" },
];

export function TopNav() {
  const pathname = usePathname();
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center justify-between px-3 lg:px-4"
      style={{
        background: "rgba(8,11,15,0.95)",
        borderBottom: "1px solid rgba(255,179,71,0.2)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 0 20px rgba(255,179,71,0.06)",
      }}
    >
      {/* Left: hamburger (mobile) + logo */}
      <div className="flex items-center gap-2">
        <MobileDrawer />
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span
            className="hidden sm:inline"
            style={{ fontFamily: "Orbitron, monospace", fontSize: "1rem", fontWeight: 800, color: "#ffb347", letterSpacing: "0.05em", textShadow: "0 0 12px rgba(255,179,71,0.5)" }}
          >
            ⚡ THE LAB
          </span>
          <span
            className="sm:hidden"
            style={{ fontFamily: "Orbitron, monospace", fontSize: "0.85rem", fontWeight: 800, color: "#ffb347", textShadow: "0 0 12px rgba(255,179,71,0.5)" }}
          >
            ⚡
          </span>
        </Link>
      </div>

      {/* Center: nav tabs — hidden on mobile */}
      <div className="hidden lg:flex items-center gap-1">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className="px-4 py-1 text-xs font-mono font-semibold tracking-widest transition-all duration-150"
              style={{
                color: active ? "#ffb347" : "#445566",
                borderBottom: active ? "2px solid #ffb347" : "2px solid transparent",
                textShadow: active ? "0 0 8px rgba(255,179,71,0.4)" : "none",
                letterSpacing: "0.14em",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Right: clock + icons */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs" style={{ color: "#00e5ff", textShadow: "0 0 8px rgba(0,229,255,0.4)" }}>
          {time}
        </span>
        <Bell size={14} style={{ color: "#445566" }} className="cursor-pointer hover:text-neon-amber transition-colors hidden sm:block" />
        <Settings size={14} style={{ color: "#445566" }} className="cursor-pointer hover:text-neon-amber transition-colors hidden sm:block" />
      </div>
    </nav>
  );
}
