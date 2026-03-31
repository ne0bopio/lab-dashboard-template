"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Calendar, User } from "lucide-react";
import type { Task } from "@/types/workspace";

const PRIORITY_COLORS: Record<string, string> = {
  low: "#445566",
  medium: "#00e5ff",
  high: "#ffb347",
  urgent: "#ff2052",
};

const ASSIGNEE_COLORS: Record<string, string> = {
  orchestrator: "#ffb347",
  kirby: "#00e5ff",
  frida: "#bf5fff",
  euge: "#39ff14",
  midas: "#ffd700",
  anonymous: "#ff2052",
  owner: "#ff8c00",
};

export function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColor = PRIORITY_COLORS[task.priority] || "#445566";
  const assigneeColor = task.assignee
    ? ASSIGNEE_COLORS[task.assignee.toLowerCase()] || "#8899aa"
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className="group rounded-lg p-3 cursor-pointer transition-all duration-150 hover:-translate-y-0.5"
      {...attributes}
    >
      <div
        className="rounded-lg p-3"
        style={{
          background: "#0d1117",
          border: "1px solid #1e2d3d",
          boxShadow: isDragging ? "0 8px 24px rgba(0,0,0,0.4)" : "0 1px 4px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header: priority dot + grip */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: priorityColor, boxShadow: `0 0 6px ${priorityColor}40` }}
            />
            <span
              className="font-mono font-medium truncate"
              style={{ fontSize: "0.76rem", color: "#e8eaed" }}
            >
              {task.title}
            </span>
          </div>
          <button
            {...listeners}
            className="opacity-0 group-hover:opacity-40 hover:!opacity-80 shrink-0 cursor-grab"
            style={{ color: "#445566" }}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical size={14} />
          </button>
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.tags.map((tag) => (
              <span
                key={tag}
                className="font-mono px-1.5 py-0.5 rounded"
                style={{
                  fontSize: "0.55rem",
                  background: "#1a2332",
                  color: "#8899aa",
                  border: "1px solid #1e2d3d",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer: assignee + due date */}
        <div className="flex items-center justify-between mt-1">
          {assigneeColor && task.assignee ? (
            <span
              className="flex items-center gap-1 font-mono px-1.5 py-0.5 rounded-full"
              style={{
                fontSize: "0.58rem",
                background: `${assigneeColor}15`,
                color: assigneeColor,
                border: `1px solid ${assigneeColor}30`,
              }}
            >
              <User size={9} />
              {task.assignee}
            </span>
          ) : (
            <span />
          )}

          {task.due_date && (
            <span
              className="flex items-center gap-1 font-mono"
              style={{ fontSize: "0.58rem", color: "#445566" }}
            >
              <Calendar size={9} />
              {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
