"use client";
import { useState, useEffect } from "react";
import { X, Check, Trash2 } from "lucide-react";
import { CalendarEvent, CATEGORY_CONFIG, EventCategory } from "./calendarTypes";
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, completeCalendarEvent } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

const CATEGORIES = Object.entries(CATEGORY_CONFIG) as [EventCategory, { color: string; label: string }][];

interface EventModalProps {
  event?: CalendarEvent | null;          // null = create mode
  defaultDate?: string;                  // ISO date string for new events
  onClose: () => void;
  onSaved: () => void;
}

function toLocalDatetime(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventModal({ event, defaultDate, onClose, onSaved }: EventModalProps) {
  const isEdit = !!event;

  const [title, setTitle]             = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [start, setStart]             = useState(event ? toLocalDatetime(event.start) : (defaultDate ? `${defaultDate}T09:00` : ""));
  const [end, setEnd]                 = useState(event?.end ? toLocalDatetime(event.end) : "");
  const [allDay, setAllDay]           = useState(event?.all_day ?? false);
  const [category, setCategory]       = useState<EventCategory>(event?.category || "reminder");
  const [assignedTo, setAssignedTo]   = useState(event?.assigned_to || "");
  const [recurrence, setRecurrence]   = useState<"none"|"daily"|"weekly"|"biweekly"|"monthly">(event?.recurrence || "none");
  const [loading, setLoading]         = useState(false);
  const [deleting, setDeleting]       = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function handleSave() {
    if (!title.trim() || !start) return toast("Title and start date required", "error");
    setLoading(true);
    try {
      const body: any = { title: title.trim(), description, start: new Date(start).toISOString(), all_day: allDay, category, recurrence };
      if (end) body.end = new Date(end).toISOString();
      if (assignedTo) body.assigned_to = assignedTo;
      if (isEdit) await updateCalendarEvent(event!.id, body);
      else await createCalendarEvent(body);
      toast(isEdit ? "Event updated" : "Event created", "success");
      onSaved();
    } catch { toast("Failed to save", "error"); }
    finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${event?.title}"?`)) return;
    setDeleting(true);
    try {
      await deleteCalendarEvent(event!.id);
      toast("Event deleted", "info");
      onSaved();
    } catch { toast("Failed to delete", "error"); }
    finally { setDeleting(false); }
  }

  async function handleComplete() {
    try {
      await completeCalendarEvent(event!.id);
      toast("Marked as done ✓", "success");
      onSaved();
    } catch { toast("Failed", "error"); }
  }

  const catColor = CATEGORY_CONFIG[category].color;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl p-6 flex flex-col gap-4"
        style={{ background: "#111820", border: "1px solid #1e2d3d", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-mono font-bold" style={{ color: "#e8eaed", fontSize: "0.9rem", letterSpacing: "0.04em" }}>
            {isEdit ? "EDIT EVENT" : "NEW EVENT"}
          </h2>
          <button onClick={onClose} style={{ color: "#445566" }}><X size={16} /></button>
        </div>

        {/* Title */}
        <div>
          <label className="font-mono" style={{ fontSize: "0.6rem", color: "#445566", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>TITLE *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title..." autoFocus
            className="w-full px-3 py-2 rounded font-mono outline-none"
            style={{ background: "#0d1117", border: "1px solid #1e2d3d", color: "#e8eaed", fontSize: "0.85rem", fontFamily: "Inter, sans-serif" }}
            onFocus={e => e.target.style.borderColor = catColor}
            onBlur={e => e.target.style.borderColor = "#1e2d3d"}
          />
        </div>

        {/* Category */}
        <div>
          <label className="font-mono" style={{ fontSize: "0.6rem", color: "#445566", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>CATEGORY</label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(([key, { color, label }]) => (
              <button key={key} onClick={() => setCategory(key)}
                className="px-2 py-1 rounded font-mono transition-all"
                style={{ fontSize: "0.55rem", letterSpacing: "0.06em", background: category === key ? `${color}20` : "transparent", color: category === key ? color : "#445566", border: `1px solid ${category === key ? `${color}50` : "#1e2d3d"}` }}>
                {label.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Start / End */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-mono" style={{ fontSize: "0.6rem", color: "#445566", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>START *</label>
            <input type={allDay ? "date" : "datetime-local"} value={start} onChange={e => setStart(e.target.value)}
              className="w-full px-3 py-2 rounded font-mono outline-none"
              style={{ background: "#0d1117", border: "1px solid #1e2d3d", color: "#e8eaed", fontSize: "0.75rem" }}
            />
          </div>
          <div>
            <label className="font-mono" style={{ fontSize: "0.6rem", color: "#445566", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>END</label>
            <input type={allDay ? "date" : "datetime-local"} value={end} onChange={e => setEnd(e.target.value)}
              className="w-full px-3 py-2 rounded font-mono outline-none"
              style={{ background: "#0d1117", border: "1px solid #1e2d3d", color: "#e8eaed", fontSize: "0.75rem" }}
            />
          </div>
        </div>

        {/* All day toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => setAllDay(!allDay)}
            className="w-8 h-4 rounded-full transition-colors relative"
            style={{ background: allDay ? catColor : "#1e2d3d" }}
          >
            <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all" style={{ left: allDay ? "calc(100% - 14px)" : 2 }} />
          </div>
          <span className="font-mono" style={{ fontSize: "0.6rem", color: "#8899aa", letterSpacing: "0.08em" }}>ALL DAY</span>
        </label>

        {/* Description */}
        <div>
          <label className="font-mono" style={{ fontSize: "0.6rem", color: "#445566", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>DESCRIPTION</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Optional notes..."
            className="w-full px-3 py-2 rounded outline-none resize-none"
            style={{ background: "#0d1117", border: "1px solid #1e2d3d", color: "#e8eaed", fontSize: "0.78rem", fontFamily: "Inter, sans-serif" }}
          />
        </div>

        {/* Assigned to + Recurrence */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-mono" style={{ fontSize: "0.6rem", color: "#445566", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>ASSIGNED TO</label>
            <input value={assignedTo} onChange={e => setAssignedTo(e.target.value)} placeholder="agent / owner"
              className="w-full px-3 py-2 rounded font-mono outline-none"
              style={{ background: "#0d1117", border: "1px solid #1e2d3d", color: "#e8eaed", fontSize: "0.75rem" }}
            />
          </div>
          <div>
            <label className="font-mono" style={{ fontSize: "0.6rem", color: "#445566", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>RECURRENCE</label>
            <select value={recurrence} onChange={e => setRecurrence(e.target.value as any)}
              className="w-full px-3 py-2 rounded font-mono outline-none"
              style={{ background: "#0d1117", border: "1px solid #1e2d3d", color: "#e8eaed", fontSize: "0.75rem" }}>
              {(["none","daily","weekly","biweekly","monthly"] as const).map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid #1e2d3d" }}>
          <div className="flex gap-2">
            {isEdit && (
              <>
                {!event?.completed && (
                  <button onClick={handleComplete} className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono transition-all hover:opacity-80"
                    style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)", fontSize: "0.65rem" }}>
                    <Check size={11} /> DONE
                  </button>
                )}
                <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono transition-all hover:opacity-80"
                  style={{ background: "rgba(255,32,82,0.1)", color: "#ff2052", border: "1px solid rgba(255,32,82,0.25)", fontSize: "0.65rem" }}>
                  <Trash2 size={11} /> {deleting ? "..." : "DELETE"}
                </button>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-1.5 rounded font-mono transition-all hover:opacity-80"
              style={{ background: "transparent", color: "#445566", border: "1px solid #1e2d3d", fontSize: "0.65rem" }}>
              CANCEL
            </button>
            <button onClick={handleSave} disabled={loading || !title.trim()}
              className="px-4 py-1.5 rounded font-mono font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-40"
              style={{ background: `${catColor}20`, color: catColor, border: `1px solid ${catColor}40`, fontSize: "0.65rem" }}>
              {loading ? "SAVING..." : isEdit ? "UPDATE" : "CREATE"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
