"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, Lightbulb, Users, Wrench, FileText, Settings, Globe, FolderTree, KanbanSquare } from "lucide-react";

const NAV_ITEMS = [
  { icon: LayoutDashboard, href: "/",          label: "Dashboard" },
  { icon: Lightbulb,       href: "/ideas",     label: "Ideas" },
  { icon: Globe,           href: "/websites",  label: "Websites" },
  { icon: Users,           href: "/agents",    label: "Agents" },
  { icon: Wrench,          href: "/tools",     label: "Tools" },
  { icon: FileText,        href: "/docs",      label: "Docs" },
  { icon: FolderTree,      href: "/workspace", label: "Workspace" },
  { icon: KanbanSquare,    href: "/tasks",     label: "Tasks" },
  { icon: Settings,        href: "/settings",  label: "Settings" },
];

export function MobileDrawer() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      {/* Hamburger button — visible only on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden flex items-center justify-center w-8 h-8 rounded"
        style={{ color: "#8899aa" }}
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {/* Overlay + drawer */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-[200]"
            style={{ background: "rgba(8,11,15,0.8)", backdropFilter: "blur(4px)" }}
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed left-0 top-0 bottom-0 z-[201] w-64 flex flex-col py-4 px-3"
            style={{
              background: "#0d1117",
              borderRight: "1px solid rgba(255,179,71,0.2)",
              boxShadow: "4px 0 30px rgba(0,0,0,0.5)",
              animation: "slideInLeft 0.2s ease-out",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 px-2">
              <span
                style={{
                  fontFamily: "Orbitron, monospace",
                  fontSize: "0.9rem",
                  fontWeight: 800,
                  color: "#ffb347",
                  textShadow: "0 0 10px rgba(255,179,71,0.5)",
                }}
              >
                ⚡ THE LAB
              </span>
              <button onClick={() => setOpen(false)} style={{ color: "#445566" }}>
                <X size={16} />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map(({ icon: Icon, href, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
                    style={{
                      background: active ? "rgba(255,179,71,0.08)" : "transparent",
                      borderLeft: active ? "2px solid #ffb347" : "2px solid transparent",
                      color: active ? "#ffb347" : "#8899aa",
                    }}
                  >
                    <Icon size={16} />
                    <span className="font-mono text-xs font-semibold" style={{ letterSpacing: "0.08em" }}>
                      {label.toUpperCase()}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="mt-auto px-3">
              <div className="font-mono" style={{ color: "#445566", fontSize: "0.55rem", letterSpacing: "0.06em" }}>
                Lab Dashboard v2026.03
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
