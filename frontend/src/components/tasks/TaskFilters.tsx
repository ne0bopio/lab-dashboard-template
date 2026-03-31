"use client";
import { X } from "lucide-react";

const AGENTS = ["Owner", "Orchestrator", "Engineer", "Designer", "Researcher", "Analyst", "Security"];
const PRIORITIES = ["low", "medium", "high", "urgent"];

export function TaskFilters({
  assignee,
  priority,
  onAssigneeChange,
  onPriorityChange,
  onClear,
}: {
  assignee: string;
  priority: string;
  onAssigneeChange: (v: string) => void;
  onPriorityChange: (v: string) => void;
  onClear: () => void;
}) {
  const hasFilters = assignee || priority;

  const selectStyle = {
    background: "#111820",
    border: "1px solid #1e2d3d",
    color: "#8899aa",
    fontSize: "0.7rem",
    fontFamily: "monospace",
    borderRadius: 6,
    padding: "4px 8px",
    outline: "none",
  } as const;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <select value={assignee} onChange={(e) => onAssigneeChange(e.target.value)} style={selectStyle}>
        <option value="">All Assignees</option>
        {AGENTS.map((a) => (
          <option key={a} value={a.toLowerCase()}>
            {a}
          </option>
        ))}
      </select>
      <select value={priority} onChange={(e) => onPriorityChange(e.target.value)} style={selectStyle}>
        <option value="">All Priorities</option>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </option>
        ))}
      </select>
      {hasFilters && (
        <button
          onClick={onClear}
          className="flex items-center gap-1 font-mono transition-opacity hover:opacity-100 opacity-60"
          style={{ fontSize: "0.65rem", color: "#ff2052" }}
        >
          <X size={11} />
          Clear
        </button>
      )}
    </div>
  );
}
