"use client";
import { CalendarEvent, CATEGORY_CONFIG } from "./calendarTypes";

interface UpcomingSidebarProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

function formatEventTime(event: CalendarEvent) {
  if (event.all_day) return "All day";
  const d = new Date(event.start);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatEventDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function UpcomingSidebar({ events, onEventClick }: UpcomingSidebarProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="font-mono px-2 pb-2" style={{ fontSize: "0.6rem", color: "#445566", letterSpacing: "0.1em", borderBottom: "1px solid #1e2d3d" }}>
        NEXT 7 DAYS · {events.length} EVENT{events.length !== 1 ? "S" : ""}
      </div>
      {events.length === 0 ? (
        <div className="font-mono py-6 text-center" style={{ color: "#445566", fontSize: "0.65rem" }}>Nothing scheduled</div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {events.map(event => {
            const cat = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.reminder;
            return (
              <button
                key={event.id}
                onClick={() => onEventClick(event)}
                className="text-left px-2 py-2 rounded transition-all hover:bg-white/5 group"
                style={{ borderLeft: `2px solid ${cat.color}`, opacity: event.completed ? 0.5 : 1 }}
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="font-mono font-bold truncate" style={{ fontSize: "0.7rem", color: "#e8eaed", textDecoration: event.completed ? "line-through" : "none" }}>
                    {event.title}
                  </span>
                  {event.completed && <span style={{ fontSize: "0.5rem", color: "#22c55e" }}>✓</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono" style={{ fontSize: "0.55rem", color: cat.color }}>{formatEventDate(event.start)}</span>
                  <span className="font-mono" style={{ fontSize: "0.55rem", color: "#445566" }}>{formatEventTime(event)}</span>
                  {event.assigned_to && (
                    <span className="font-mono" style={{ fontSize: "0.48rem", color: "#445566" }}>→ {event.assigned_to}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
