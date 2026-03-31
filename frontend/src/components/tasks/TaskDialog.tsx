"use client";
import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Trash2, Save, Loader2 } from "lucide-react";
import { createTask, updateTask, deleteTask } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import type { Task } from "@/types/workspace";

const STATUSES = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const PRIORITIES = [
  { value: "low", label: "Low", color: "#445566" },
  { value: "medium", label: "Medium", color: "#00e5ff" },
  { value: "high", label: "High", color: "#ffb347" },
  { value: "urgent", label: "Urgent", color: "#ff2052" },
];

const AGENTS = ["Owner", "Orchestrator", "Engineer", "Designer", "Researcher", "Analyst", "Security"];

export function TaskDialog({
  task,
  open,
  onOpenChange,
  onMutated,
}: {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMutated: () => void;
}) {
  const isNew = !task;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
      setAssignee(task.assignee || "");
      setDueDate(task.due_date || "");
      setTagsStr(task.tags?.join(", ") || "");
    } else {
      setTitle("");
      setDescription("");
      setStatus("todo");
      setPriority("medium");
      setAssignee("");
      setDueDate("");
      setTagsStr("");
    }
  }, [task, open]);

  async function handleSave() {
    if (!title.trim()) {
      toast("Title is required", "warning");
      return;
    }
    setSaving(true);
    try {
      const tags = tagsStr
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const data = {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        assignee: assignee || undefined,
        due_date: dueDate || undefined,
        tags: tags.length > 0 ? tags : undefined,
      };

      if (isNew) {
        await createTask(data);
        toast("Task created", "success");
      } else {
        await updateTask(task!.id, data);
        toast("Task updated", "success");
      }
      onMutated();
      onOpenChange(false);
    } catch (err: any) {
      toast(`Failed: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!task) return;
    if (!confirm(`Delete "${task.title}"?`)) return;
    setDeleting(true);
    try {
      await deleteTask(task.id);
      toast("Task deleted", "success");
      onMutated();
      onOpenChange(false);
    } catch (err: any) {
      toast(`Delete failed: ${err.message}`, "error");
    } finally {
      setDeleting(false);
    }
  }

  const selectStyle = {
    background: "#111820",
    border: "1px solid #1e2d3d",
    color: "#e8eaed",
    fontSize: "0.75rem",
    fontFamily: "monospace",
    borderRadius: 6,
    padding: "6px 8px",
    outline: "none",
  } as const;

  const inputStyle = {
    ...selectStyle,
    width: "100%",
  } as const;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-[300]"
          style={{ background: "rgba(8,11,15,0.85)", backdropFilter: "blur(4px)" }}
        />
        <Dialog.Content
          className="fixed z-[301] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl p-5"
          style={{
            background: "#0d1117",
            border: "1px solid #1e2d3d",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            maxHeight: "85vh",
            overflowY: "auto",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="font-mono font-bold" style={{ fontSize: "0.9rem", color: "#ffb347" }}>
              {isNew ? "New Task" : "Edit Task"}
            </Dialog.Title>
            <Dialog.Close className="p-1 rounded hover:bg-bg-raised transition-colors" style={{ color: "#445566" }}>
              <X size={16} />
            </Dialog.Close>
          </div>

          {/* Form */}
          <div className="flex flex-col gap-3">
            {/* Title */}
            <div>
              <label className="font-mono block mb-1" style={{ fontSize: "0.65rem", color: "#8899aa" }}>
                TITLE *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title..."
                style={inputStyle}
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="font-mono block mb-1" style={{ fontSize: "0.65rem", color: "#8899aa" }}>
                DESCRIPTION
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details..."
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            {/* Status + Priority row */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="font-mono block mb-1" style={{ fontSize: "0.65rem", color: "#8899aa" }}>
                  STATUS
                </label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...selectStyle, width: "100%" }}>
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="font-mono block mb-1" style={{ fontSize: "0.65rem", color: "#8899aa" }}>
                  PRIORITY
                </label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ ...selectStyle, width: "100%" }}>
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assignee + Due date row */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="font-mono block mb-1" style={{ fontSize: "0.65rem", color: "#8899aa" }}>
                  ASSIGNEE
                </label>
                <select value={assignee} onChange={(e) => setAssignee(e.target.value)} style={{ ...selectStyle, width: "100%" }}>
                  <option value="">Unassigned</option>
                  {AGENTS.map((a) => (
                    <option key={a} value={a.toLowerCase()}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="font-mono block mb-1" style={{ fontSize: "0.65rem", color: "#8899aa" }}>
                  DUE DATE
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="font-mono block mb-1" style={{ fontSize: "0.65rem", color: "#8899aa" }}>
                TAGS (comma-separated)
              </label>
              <input
                type="text"
                value={tagsStr}
                onChange={(e) => setTagsStr(e.target.value)}
                placeholder="frontend, api, urgent..."
                style={inputStyle}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-5 pt-3" style={{ borderTop: "1px solid #1e2d3d" }}>
            {!isNew ? (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono transition-all"
                style={{
                  fontSize: "0.7rem",
                  color: "#ff2052",
                  background: "rgba(255,32,82,0.08)",
                  border: "1px solid rgba(255,32,82,0.2)",
                }}
              >
                {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Dialog.Close
                className="px-3 py-1.5 rounded font-mono transition-all"
                style={{
                  fontSize: "0.7rem",
                  color: "#8899aa",
                  background: "#111820",
                  border: "1px solid #1e2d3d",
                }}
              >
                Cancel
              </Dialog.Close>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono transition-all"
                style={{
                  fontSize: "0.7rem",
                  color: "#ffb347",
                  background: "rgba(255,179,71,0.12)",
                  border: "1px solid rgba(255,179,71,0.3)",
                }}
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                {isNew ? "Create" : "Save"}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
