"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Lightbulb, Users, Wrench, FileText, Settings, CalendarDays, Globe, FolderTree, KanbanSquare } from "lucide-react";

const RAIL_ITEMS = [
  { icon: LayoutDashboard, href: "/",          label: "Dashboard" },
  { icon: Lightbulb,       href: "/ideas",     label: "Ideas" },
  { icon: Globe,           href: "/websites",  label: "Websites" },
  { icon: CalendarDays,    href: "/calendar",  label: "Calendar" },
  { icon: Users,           href: "/agents",    label: "Agents" },
  { icon: Wrench,          href: "/tools",     label: "Tools" },
  { icon: FileText,        href: "/docs",      label: "Docs" },
  { icon: FolderTree,      href: "/workspace", label: "Workspace" },
  { icon: KanbanSquare,    href: "/tasks",     label: "Tasks" },
  { icon: Settings,        href: "/settings",  label: "Settings" },
];

export function LeftRail() {
  const pathname = usePathname();
  return (
    <aside
      className="fixed left-0 top-12 bottom-8 z-40 w-20 flex-col items-center pt-4 gap-1 hidden lg:flex"
      style={{
        background: "rgba(8,11,15,0.9)",
        borderRight: "1px solid #1e2d3d",
      }}
    >
      {RAIL_ITEMS.map(({ icon: Icon, href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            title={label}
            className="relative w-12 h-12 flex items-center justify-center rounded-lg transition-all duration-150 group"
            style={{
              background: active ? "rgba(255,179,71,0.08)" : "transparent",
              borderLeft: active ? "2px solid #ffb347" : "2px solid transparent",
              boxShadow: active ? "0 0 12px rgba(255,179,71,0.15)" : "none",
            }}
          >
            <Icon
              size={18}
              style={{
                color: active ? "#ffb347" : "#445566",
                filter: active ? "drop-shadow(0 0 4px rgba(255,179,71,0.6))" : "none",
              }}
            />
            <span
              className="absolute left-14 px-2 py-1 text-xs font-mono rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50"
              style={{ background: "#1a2332", color: "#e8eaed", border: "1px solid #1e2d3d" }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </aside>
  );
}
