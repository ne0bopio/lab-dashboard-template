"use client";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Clock, Zap, Check, CalendarDays, LayoutGrid, List } from "lucide-react";
import { PageTitle } from "@/components/ui/PageTitle";
import { PageTransition } from "@/components/ui/PageTransition";
import { ToastContainer, toast } from "@/components/ui/Toast";
import { EventModal } from "@/components/calendar/EventModal";
import { CalendarEvent, CATEGORY_CONFIG } from "@/components/calendar/calendarTypes";
import { getCalendarEvents, getUpcomingEvents, completeCalendarEvent } from "@/lib/api";

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}
function getWeekDays(center: Date): Date[] {
  const days: Date[] = [];
  const start = new Date(center);
  start.setDate(start.getDate() - 3);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}
function timeUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return "now";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m`;
  return `${Math.floor(hrs / 24)}d`;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const FULL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState<Date>(today);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [viewMode, setViewMode] = useState<"timeline" | "eagle">("timeline");
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined);
  const weekStripRef = useRef<HTMLDivElement>(null);

  // Swipe on week strip
  const touchStartRef = useRef<{ x: number; t: number } | null>(null);
  const handleStripTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, t: selectedDay.getTime() };
  }, [selectedDay]);
  const handleStripTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    if (Math.abs(dx) > 50) {
      const newDay = new Date(selectedDay);
      newDay.setDate(newDay.getDate() + (dx < 0 ? 7 : -7));
      setSelectedDay(newDay);
    }
    touchStartRef.current = null;
  }, [selectedDay]);

  // Fetch events for current month range (buffer ±7 days for week view)
  const rangeStart = new Date(selectedDay);
  rangeStart.setDate(rangeStart.getDate() - 14);
  const rangeEnd = new Date(selectedDay);
  rangeEnd.setDate(rangeEnd.getDate() + 14);

  const { data: events = [] } = useQuery({
    queryKey: ["calendar", toDateKey(rangeStart), toDateKey(rangeEnd)],
    queryFn: () => getCalendarEvents(rangeStart.toISOString(), rangeEnd.toISOString()),
    refetchInterval: 30000,
  });

  const { data: upcoming = [] } = useQuery({
    queryKey: ["calendar-upcoming"],
    queryFn: () => getUpcomingEvents(14),
    refetchInterval: 30000,
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["calendar"] });
    queryClient.invalidateQueries({ queryKey: ["calendar-upcoming"] });
  }

  // Index events
  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    (events as CalendarEvent[]).forEach(ev => {
      const key = toDateKey(new Date(ev.start));
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  const weekDays = getWeekDays(selectedDay);
  const selectedKey = toDateKey(selectedDay);
  const dayEvents = (eventsByDay[selectedKey] || []).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  // Next upcoming event (for hero)
  const nextEvent = (upcoming as CalendarEvent[]).find(ev => !ev.completed && new Date(ev.start).getTime() > Date.now());

  function openCreate(date?: Date) {
    setEditEvent(null);
    setDefaultDate(toDateKey(date || selectedDay));
    setShowModal(true);
  }
  function openEdit(ev: CalendarEvent) {
    setEditEvent(ev);
    setDefaultDate(undefined);
    setShowModal(true);
  }
  async function handleComplete(ev: CalendarEvent, e: React.MouseEvent) {
    e.stopPropagation();
    try { await completeCalendarEvent(ev.id); toast("Done ✓", "success"); refresh(); }
    catch { toast("Failed", "error"); }
  }

  // Month picker grid
  const monthPickerYear = selectedDay.getFullYear();
  const fullMonthGrid = useMemo(() => {
    const first = new Date(monthPickerYear, selectedDay.getMonth(), 1);
    const firstDay = first.getDay();
    const daysInMonth = new Date(monthPickerYear, selectedDay.getMonth() + 1, 0).getDate();
    const prev = new Date(monthPickerYear, selectedDay.getMonth(), 0).getDate();
    const days: { date: Date; current: boolean }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) days.push({ date: new Date(monthPickerYear, selectedDay.getMonth() - 1, prev - i), current: false });
    for (let i = 1; i <= daysInMonth; i++) days.push({ date: new Date(monthPickerYear, selectedDay.getMonth(), i), current: true });
    while (days.length < 42) { const n = days.length - firstDay - daysInMonth + 1; days.push({ date: new Date(monthPickerYear, selectedDay.getMonth() + 1, n), current: false }); }
    return days;
  }, [monthPickerYear, selectedDay]);

  return (
    <PageTransition>
    <div className="p-4 pb-20" style={{ minHeight: "calc(100vh - 80px)" }}>
      <PageTitle title="Calendar" />
      <ToastContainer />

      {/* ══════ VIEW TOGGLE ══════ */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid #1e2d3d" }}>
          <button onClick={() => setViewMode("timeline")} className="flex items-center gap-2 px-4 font-mono transition-all active:scale-95"
            style={{ fontSize: "0.65rem", letterSpacing: "0.06em", background: viewMode === "timeline" ? "rgba(255,179,71,0.12)" : "transparent", color: viewMode === "timeline" ? "#ffb347" : "#445566", minHeight: 44 }}>
            <List size={15} /> TIMELINE
          </button>
          <button onClick={() => setViewMode("eagle")} className="flex items-center gap-2 px-4 font-mono transition-all active:scale-95"
            style={{ fontSize: "0.65rem", letterSpacing: "0.06em", background: viewMode === "eagle" ? "rgba(255,179,71,0.12)" : "transparent", color: viewMode === "eagle" ? "#ffb347" : "#445566", borderLeft: "1px solid #1e2d3d", minHeight: 44 }}>
            <LayoutGrid size={15} /> EAGLE VIEW
          </button>
        </div>
        <button onClick={() => openCreate()} className="rounded-xl flex items-center justify-center transition-all active:scale-90"
          style={{ width: 48, height: 48, background: "rgba(255,179,71,0.1)", border: "1px solid rgba(255,179,71,0.3)", color: "#ffb347" }}>
          <Plus size={22} />
        </button>
      </div>

      {/* ══════ EAGLE VIEW — infinite scroll months ══════ */}
      {viewMode === "eagle" && (() => {
        // Generate 12 months: 1 past + current + 10 future
        const monthsToShow: { year: number; month: number }[] = [];
        const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        for (let i = 0; i < 12; i++) {
          const d = new Date(startDate);
          d.setMonth(d.getMonth() + i);
          monthsToShow.push({ year: d.getFullYear(), month: d.getMonth() });
        }

        return (
          <div>
            {/* Sticky day headers */}
            <div className="grid grid-cols-7 mb-2 sticky top-12 z-10 py-1" style={{ background: "#080b0f" }}>
              {["S","M","T","W","T","F","S"].map((d, i) => (
                <div key={i} className="font-mono text-center py-1" style={{ color: "#445566", fontSize: "0.65rem", fontWeight: 700 }}>{d}</div>
              ))}
            </div>

            {monthsToShow.map(({ year, month }) => {
              const firstDay = new Date(year, month, 1).getDay();
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const prevDays = new Date(year, month, 0).getDate();
              const cells: { date: Date; current: boolean }[] = [];
              for (let i = firstDay - 1; i >= 0; i--) cells.push({ date: new Date(year, month - 1, prevDays - i), current: false });
              for (let i = 1; i <= daysInMonth; i++) cells.push({ date: new Date(year, month, i), current: true });
              while (cells.length % 7 !== 0) { const n = cells.length - firstDay - daysInMonth + 1; cells.push({ date: new Date(year, month + 1, n), current: false }); }

              const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

              return (
                <div key={`${year}-${month}`} className="mb-6">
                  {/* Month title — sticky */}
                  <div className="sticky top-[52px] z-[9] py-2 mb-2" style={{ background: "#080b0f" }}>
                    <div className="flex items-center gap-3">
                      <div className="font-mono font-bold" style={{ fontSize: "1.2rem", color: isCurrentMonth ? "#ffb347" : "#e8eaed", letterSpacing: "-0.01em" }}>
                        {FULL_MONTHS[month]}
                      </div>
                      <div className="font-mono" style={{ fontSize: "0.7rem", color: "#445566" }}>{year}</div>
                      {isCurrentMonth && <div className="font-mono px-2 py-0.5 rounded-full" style={{ fontSize: "0.5rem", background: "rgba(255,179,71,0.12)", color: "#ffb347", border: "1px solid rgba(255,179,71,0.25)" }}>NOW</div>}
                    </div>
                  </div>

                  {/* Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {cells.map(({ date, current }, i) => {
                      const k = toDateKey(date);
                      const td = isSameDay(date, today);
                      const dayEvs = eventsByDay[k] || [];
                      return (
                        <button key={i} onClick={() => { setSelectedDay(date); setViewMode("timeline"); }}
                          className="flex flex-col items-center rounded-xl transition-all active:scale-95"
                          style={{ minHeight: 60, padding: "6px 2px", background: td ? "#ffb34712" : "transparent", border: td ? "2px solid #ffb347" : "1px solid #1e2d3d08" }}>
                          <span className="font-mono font-bold" style={{ fontSize: "0.85rem", color: td ? "#ffb347" : current ? "#e8eaed" : "#1e2d3d" }}>
                            {date.getDate()}
                          </span>
                          {dayEvs.length > 0 && (
                            <div className="flex flex-col gap-0.5 mt-1 w-full px-1">
                              {dayEvs.slice(0, 2).map((ev, j) => (
                                <div key={j} className="rounded px-1 truncate font-mono" style={{ fontSize: "0.45rem", background: `${CATEGORY_CONFIG[ev.category]?.color || "#8899aa"}20`, color: CATEGORY_CONFIG[ev.category]?.color || "#8899aa", lineHeight: "14px" }}>
                                  {ev.title}
                                </div>
                              ))}
                              {dayEvs.length > 2 && <div className="font-mono text-center" style={{ fontSize: "0.4rem", color: "#445566" }}>+{dayEvs.length - 2}</div>}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ══════ TIMELINE VIEW ══════ */}
      {viewMode === "timeline" && (
      <>

      {/* ══════ HERO — TODAY + NEXT EVENT ══════ */}
      <div className="rounded-2xl overflow-hidden mb-5" style={{ background: "linear-gradient(135deg, #0d1117 0%, #111a28 50%, #0d1117 100%)", border: "1px solid #1e2d3d" }}>
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono" style={{ fontSize: "0.55rem", color: "#445566", letterSpacing: "0.15em", marginBottom: 6 }}>
                {isSameDay(selectedDay, today) ? "TODAY" : DAY_NAMES[selectedDay.getDay()].toUpperCase()}
              </div>
              <div className="font-mono font-bold" style={{ fontSize: "2rem", color: "#e8eaed", lineHeight: 1, letterSpacing: "-0.02em" }}>
                {selectedDay.getDate()}
              </div>
              <div className="font-mono" style={{ fontSize: "0.85rem", color: "#8899aa", marginTop: 4 }}>
                {FULL_MONTHS[selectedDay.getMonth()]} {selectedDay.getFullYear()}
              </div>
            </div>

            {/* Quick add */}
            <button
              onClick={() => openCreate()}
              className="rounded-2xl flex items-center justify-center transition-all active:scale-90"
              style={{ width: 56, height: 56, background: "rgba(255,179,71,0.1)", border: "1px solid rgba(255,179,71,0.3)", color: "#ffb347" }}
            >
              <Plus size={24} />
            </button>
          </div>

          {/* Next event preview */}
          {nextEvent && (
            <div className="mt-4 flex items-center gap-3 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1e2d3d" }}>
              <div className="flex items-center justify-center rounded-lg" style={{ width: 40, height: 40, background: `${CATEGORY_CONFIG[nextEvent.category]?.color || "#8899aa"}15`, flexShrink: 0 }}>
                <Zap size={18} style={{ color: CATEGORY_CONFIG[nextEvent.category]?.color || "#8899aa" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono" style={{ fontSize: "0.55rem", color: "#445566", letterSpacing: "0.1em" }}>NEXT UP</div>
                <div className="font-mono font-bold truncate" style={{ fontSize: "0.8rem", color: "#e8eaed" }}>{nextEvent.title}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-mono font-bold" style={{ fontSize: "0.9rem", color: CATEGORY_CONFIG[nextEvent.category]?.color || "#ffb347" }}>
                  {timeUntil(nextEvent.start)}
                </div>
                <div className="font-mono" style={{ fontSize: "0.5rem", color: "#445566" }}>
                  {formatTime(nextEvent.start)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════ WEEK STRIP — horizontally scrollable ══════ */}
      <div
        ref={weekStripRef}
        onTouchStart={handleStripTouchStart}
        onTouchEnd={handleStripTouchEnd}
        className="flex gap-2 mb-5 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {weekDays.map(day => {
          const key = toDateKey(day);
          const isSelected = key === selectedKey;
          const isToday = isSameDay(day, today);
          const hasEvents = (eventsByDay[key] || []).length > 0;
          const eventCount = (eventsByDay[key] || []).length;

          return (
            <button
              key={key}
              onClick={() => setSelectedDay(day)}
              className="flex-1 min-w-[52px] flex flex-col items-center gap-1 py-3 rounded-2xl transition-all active:scale-95"
              style={{
                background: isSelected ? "#ffb34718" : "transparent",
                border: isSelected ? "2px solid #ffb347" : isToday ? "1px solid #ffb34730" : "1px solid #1e2d3d",
              }}
            >
              <span className="font-mono" style={{ fontSize: "0.55rem", color: isSelected ? "#ffb347" : "#445566", letterSpacing: "0.06em" }}>
                {DAY_NAMES[day.getDay()]}
              </span>
              <span className="font-mono font-bold" style={{ fontSize: "1.1rem", color: isSelected ? "#ffb347" : isToday ? "#e8eaed" : "#8899aa" }}>
                {day.getDate()}
              </span>
              {hasEvents ? (
                <div className="flex gap-0.5">
                  {(eventsByDay[key] || []).slice(0, 3).map((ev, i) => (
                    <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: CATEGORY_CONFIG[ev.category]?.color || "#8899aa" }} />
                  ))}
                </div>
              ) : (
                <div style={{ width: 5, height: 5 }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ══════ MONTH PICKER — expandable ══════ */}
      <button
        onClick={() => setShowMonthPicker(!showMonthPicker)}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl mb-4 transition-all active:scale-[0.98]"
        style={{ background: "#0d1117", border: "1px solid #1e2d3d" }}
      >
        <CalendarDays size={14} style={{ color: "#445566" }} />
        <span className="font-mono" style={{ fontSize: "0.65rem", color: "#445566", letterSpacing: "0.08em" }}>
          {showMonthPicker ? "HIDE" : "SHOW"} FULL MONTH
        </span>
        {showMonthPicker ? <ChevronUp size={12} style={{ color: "#445566" }} /> : <ChevronDown size={12} style={{ color: "#445566" }} />}
      </button>

      {showMonthPicker && (
        <div className="mb-5 rounded-2xl p-4" style={{ background: "#0d1117", border: "1px solid #1e2d3d" }}>
          {/* Month/year nav */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => { const d = new Date(selectedDay); d.setMonth(d.getMonth() - 1); setSelectedDay(d); }}
              className="rounded-lg px-3 py-2 font-mono transition-all active:scale-90" style={{ color: "#445566", background: "#111820", border: "1px solid #1e2d3d", fontSize: "0.65rem" }}>
              ◀ PREV
            </button>
            <span className="font-mono font-bold" style={{ color: "#e8eaed", fontSize: "0.85rem" }}>
              {FULL_MONTHS[selectedDay.getMonth()]} {selectedDay.getFullYear()}
            </span>
            <button onClick={() => { const d = new Date(selectedDay); d.setMonth(d.getMonth() + 1); setSelectedDay(d); }}
              className="rounded-lg px-3 py-2 font-mono transition-all active:scale-90" style={{ color: "#445566", background: "#111820", border: "1px solid #1e2d3d", fontSize: "0.65rem" }}>
              NEXT ▶
            </button>
          </div>
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {["S","M","T","W","T","F","S"].map((d, i) => (
              <div key={i} className="font-mono text-center py-1" style={{ color: "#2d3d4d", fontSize: "0.6rem" }}>{d}</div>
            ))}
          </div>
          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {fullMonthGrid.map(({ date, current }, i) => {
              const k = toDateKey(date);
              const sel = k === selectedKey;
              const td = isSameDay(date, today);
              const has = (eventsByDay[k] || []).length > 0;
              return (
                <button
                  key={i}
                  onClick={() => { setSelectedDay(date); setShowMonthPicker(false); }}
                  className="flex flex-col items-center justify-center rounded-lg transition-all active:scale-90"
                  style={{ height: 40, background: sel ? "#ffb34720" : "transparent", border: sel ? "1.5px solid #ffb347" : td ? "1px solid #ffb34730" : "1px solid transparent" }}
                >
                  <span className="font-mono" style={{ fontSize: "0.72rem", fontWeight: sel || td ? 700 : 400, color: sel ? "#ffb347" : current ? "#8899aa" : "#1e2d3d" }}>
                    {date.getDate()}
                  </span>
                  {has && <div style={{ width: 4, height: 4, borderRadius: "50%", background: sel ? "#ffb347" : "#445566", marginTop: 1 }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════ EVENTS FOR SELECTED DAY ══════ */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-mono font-bold" style={{ fontSize: "0.75rem", color: "#e8eaed", letterSpacing: "0.04em" }}>
            {isSameDay(selectedDay, today) ? "Today's Events" : `${DAY_NAMES[selectedDay.getDay()]}, ${MONTH_NAMES[selectedDay.getMonth()]} ${selectedDay.getDate()}`}
          </div>
          <span className="font-mono" style={{ fontSize: "0.6rem", color: "#445566" }}>
            {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}
          </span>
        </div>

        {dayEvents.length === 0 ? (
          <button
            onClick={() => openCreate()}
            className="w-full py-10 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-[0.98]"
            style={{ border: "2px dashed #1e2d3d", background: "#0d111708" }}
          >
            <div className="rounded-full flex items-center justify-center" style={{ width: 48, height: 48, background: "rgba(255,179,71,0.08)", border: "1px solid rgba(255,179,71,0.2)" }}>
              <Plus size={22} style={{ color: "#ffb347" }} />
            </div>
            <span className="font-mono" style={{ color: "#2d3d4d", fontSize: "0.7rem" }}>Add event</span>
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            {dayEvents.map((ev, i) => {
              const cat = CATEGORY_CONFIG[ev.category] || CATEGORY_CONFIG.reminder;
              return (
                <button
                  key={ev.id}
                  onClick={() => openEdit(ev)}
                  className="w-full text-left rounded-2xl overflow-hidden transition-all active:scale-[0.98]"
                  style={{ background: "#0d1117", border: `1px solid ${cat.color}20`, opacity: ev.completed ? 0.45 : 1 }}
                >
                  <div className="flex items-stretch">
                    <div style={{ width: 5, background: cat.color, flexShrink: 0 }} />
                    <div className="flex-1 p-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        {!ev.all_day && (
                          <span className="font-mono flex items-center gap-1" style={{ fontSize: "0.7rem", color: cat.color }}>
                            <Clock size={11} /> {formatTime(ev.start)}
                          </span>
                        )}
                        {ev.all_day && <span className="font-mono" style={{ fontSize: "0.6rem", color: cat.color }}>ALL DAY</span>}
                        <span className="font-mono px-2 py-0.5 rounded-full" style={{ fontSize: "0.5rem", background: `${cat.color}12`, color: `${cat.color}90`, border: `1px solid ${cat.color}20` }}>
                          {cat.label}
                        </span>
                        {ev.assigned_to && <span className="font-mono" style={{ fontSize: "0.55rem", color: "#2d3d4d" }}>→ {ev.assigned_to}</span>}
                      </div>
                      <div className="font-mono font-bold" style={{ fontSize: "0.9rem", color: "#e8eaed", textDecoration: ev.completed ? "line-through" : "none", lineHeight: 1.3 }}>
                        {ev.title}
                      </div>
                      {ev.description && (
                        <p className="mt-1.5 line-clamp-2" style={{ fontSize: "0.75rem", color: "#556677", fontFamily: "Inter, sans-serif", lineHeight: 1.5 }}>{ev.description}</p>
                      )}
                    </div>
                    {/* Complete button */}
                    {!ev.completed && (
                      <div
                        onClick={e => handleComplete(ev, e)}
                        className="flex items-center justify-center transition-all active:scale-90 active:bg-green-900/20"
                        style={{ width: 60, borderLeft: "1px solid #1e2d3d", color: "#22c55e", cursor: "pointer" }}
                      >
                        <div className="rounded-full flex items-center justify-center" style={{ width: 36, height: 36, border: "2px solid #22c55e40" }}>
                          <Check size={18} />
                        </div>
                      </div>
                    )}
                    {ev.completed && (
                      <div className="flex items-center justify-center" style={{ width: 60 }}>
                        <Check size={18} style={{ color: "#22c55e" }} />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════ UPCOMING TIMELINE ══════ */}
      {(upcoming as CalendarEvent[]).filter(e => !e.completed).length > 0 && (
        <div className="mt-2">
          <div className="font-mono mb-3" style={{ fontSize: "0.6rem", color: "#2d3d4d", letterSpacing: "0.12em" }}>
            ─── UPCOMING ───
          </div>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[18px] top-0 bottom-0" style={{ width: 2, background: "linear-gradient(180deg, #1e2d3d, transparent)" }} />

            <div className="flex flex-col gap-3">
              {(upcoming as CalendarEvent[]).filter(e => !e.completed).slice(0, 6).map((ev, i) => {
                const cat = CATEGORY_CONFIG[ev.category] || CATEGORY_CONFIG.reminder;
                const d = new Date(ev.start);
                const isEvToday = isSameDay(d, today);
                return (
                  <button
                    key={ev.id}
                    onClick={() => { setSelectedDay(d); openEdit(ev); }}
                    className="flex items-start gap-3 text-left transition-all active:scale-[0.98] pl-1"
                  >
                    {/* Timeline dot */}
                    <div className="relative flex-shrink-0 mt-1" style={{ width: 36 }}>
                      <div
                        className="rounded-full flex items-center justify-center"
                        style={{ width: 14, height: 14, background: `${cat.color}20`, border: `2px solid ${cat.color}`, marginLeft: 10 }}
                      />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 rounded-xl p-3" style={{ background: "#0d1117", border: "1px solid #1e2d3d" }}>
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-mono" style={{ fontSize: "0.58rem", color: isEvToday ? "#ffb347" : "#445566" }}>
                          {isEvToday ? "TODAY" : `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`}
                          {!ev.all_day && ` · ${formatTime(ev.start)}`}
                        </span>
                        <span className="font-mono font-bold" style={{ fontSize: "0.65rem", color: cat.color }}>{timeUntil(ev.start)}</span>
                      </div>
                      <div className="font-mono font-bold truncate" style={{ fontSize: "0.78rem", color: "#e8eaed" }}>{ev.title}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      </>
      )}

      {/* Modal */}
      {showModal && (
        <EventModal
          event={editEvent}
          defaultDate={defaultDate}
          onClose={() => { setShowModal(false); setEditEvent(null); }}
          onSaved={() => { setShowModal(false); setEditEvent(null); refresh(); }}
        />
      )}
    </div>
    </PageTransition>
  );
}
