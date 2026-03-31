"use client";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";
import type { Task } from "@/types/workspace";

export function KanbanColumn({
  title,
  status,
  tasks,
  color,
  onTaskClick,
}: {
  title: string;
  status: string;
  tasks: Task[];
  color: string;
  onTaskClick: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      className="flex flex-col shrink-0 rounded-lg"
      style={{
        width: 300,
        minWidth: 280,
        background: isOver ? "rgba(255,179,71,0.04)" : "#0a0e14",
        border: isOver ? "1px solid rgba(255,179,71,0.2)" : "1px solid #1e2d3d",
        transition: "all 0.15s ease",
      }}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 shrink-0"
        style={{ borderBottom: `2px solid ${color}` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: color, boxShadow: `0 0 8px ${color}50` }}
          />
          <span
            className="font-mono font-semibold"
            style={{ fontSize: "0.72rem", color: "#e8eaed", letterSpacing: "0.06em" }}
          >
            {title.toUpperCase()}
          </span>
        </div>
        <span
          className="font-mono px-1.5 py-0.5 rounded"
          style={{
            fontSize: "0.6rem",
            background: `${color}15`,
            color,
            border: `1px solid ${color}30`,
          }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-1.5"
        style={{ minHeight: 100, scrollbarWidth: "thin" }}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div
              className="flex items-center justify-center rounded-lg py-8 mx-1"
              style={{
                border: "1px dashed #1e2d3d",
                color: "#445566",
                fontSize: "0.7rem",
                fontFamily: "monospace",
              }}
            >
              No tasks
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
