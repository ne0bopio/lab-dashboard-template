"use client";
import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DndContext, DragEndEvent, DragOverEvent, PointerSensor, useSensor, useSensors, closestCorners } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { getTaskBoard, moveTask } from "@/lib/api";
import { KanbanColumn } from "./KanbanColumn";
import { TaskDialog } from "./TaskDialog";
import { TaskFilters } from "./TaskFilters";
import { toast } from "@/components/ui/Toast";
import type { Task, TaskBoard } from "@/types/workspace";

const COLUMNS = [
  { key: "backlog", title: "Backlog", color: "#445566" },
  { key: "todo", title: "To Do", color: "#00e5ff" },
  { key: "in_progress", title: "In Progress", color: "#ffb347" },
  { key: "done", title: "Done", color: "#39ff14" },
];

export function KanbanBoardPage() {
  const queryClient = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const { data: board, isLoading } = useQuery<TaskBoard>({
    queryKey: ["task-board"],
    queryFn: getTaskBoard,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["task-board"] });
  }, [queryClient]);

  function filterTasks(tasks: Task[]) {
    return tasks.filter((t) => {
      if (filterAssignee && t.assignee?.toLowerCase() !== filterAssignee) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      return true;
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || !board) return;

    const taskId = active.id as string;
    // Determine target column — over could be a column id or another task id
    let targetStatus = over.id as string;

    // If we dropped on a task, find its column
    if (!COLUMNS.find((c) => c.key === targetStatus)) {
      for (const col of COLUMNS) {
        const colKey = col.key as keyof TaskBoard;
        if (board[colKey]?.find((t: Task) => t.id === targetStatus)) {
          targetStatus = col.key;
          break;
        }
      }
    }

    // Find source task and its current status
    let sourceStatus = "";
    for (const col of COLUMNS) {
      const colKey = col.key as keyof TaskBoard;
      if (board[colKey]?.find((t: Task) => t.id === taskId)) {
        sourceStatus = col.key;
        break;
      }
    }

    if (sourceStatus === targetStatus) return;

    // Optimistic update
    queryClient.setQueryData<TaskBoard>(["task-board"], (old) => {
      if (!old) return old;
      const srcKey = sourceStatus as keyof TaskBoard;
      const dstKey = targetStatus as keyof TaskBoard;
      const task = old[srcKey].find((t) => t.id === taskId);
      if (!task) return old;
      return {
        ...old,
        [srcKey]: old[srcKey].filter((t) => t.id !== taskId),
        [dstKey]: [...old[dstKey], { ...task, status: targetStatus }],
      };
    });

    try {
      await moveTask(taskId, targetStatus);
    } catch (err: any) {
      toast(`Move failed: ${err.message}`, "error");
      refetch();
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="font-mono animate-pulse" style={{ color: "#445566", fontSize: "0.8rem" }}>
          Loading board...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar: filters + new task */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <TaskFilters
          assignee={filterAssignee}
          priority={filterPriority}
          onAssigneeChange={setFilterAssignee}
          onPriorityChange={setFilterPriority}
          onClear={() => {
            setFilterAssignee("");
            setFilterPriority("");
          }}
        />
        <button
          onClick={() => {
            setEditingTask(null);
            setDialogOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono transition-all"
          style={{
            fontSize: "0.72rem",
            color: "#ffb347",
            background: "rgba(255,179,71,0.1)",
            border: "1px solid rgba(255,179,71,0.25)",
            boxShadow: "0 0 12px rgba(255,179,71,0.1)",
          }}
        >
          <Plus size={14} />
          New Task
        </button>
      </div>

      {/* Board */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "thin" }}>
          {COLUMNS.map((col) => {
            const colKey = col.key as keyof TaskBoard;
            const tasks = board ? filterTasks(board[colKey] || []) : [];
            return (
              <KanbanColumn
                key={col.key}
                title={col.title}
                status={col.key}
                tasks={tasks}
                color={col.color}
                onTaskClick={(task) => {
                  setEditingTask(task);
                  setDialogOpen(true);
                }}
              />
            );
          })}
        </div>
      </DndContext>

      {/* Task dialog */}
      <TaskDialog
        task={editingTask}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onMutated={refetch}
      />
    </div>
  );
}
