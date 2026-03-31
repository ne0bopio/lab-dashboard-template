"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { WebsiteCard, WebsiteCardOverlay, type WebsiteProject } from "./WebsiteCard";
import { advanceWebsiteProject } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import { useStageTransition, StageTransitionOverlay } from "@/components/ideas/StageTransition";

export interface WebsiteStageConfig {
  key: string;
  label: string;
  emoji: string;
  color: string;
}

export const WEBSITE_STAGES: WebsiteStageConfig[] = [
  { key: "intake",    label: "INTAKE",    emoji: "📥", color: "#ffb347" },
  { key: "discovery", label: "DISCOVERY", emoji: "🔍", color: "#00e5ff" },
  { key: "design",    label: "DESIGN",    emoji: "🎨", color: "#ff2d8a" },
  { key: "develop",   label: "DEVELOP",   emoji: "💻", color: "#2979ff" },
  { key: "review",    label: "REVIEW",    emoji: "🧪", color: "#bf5fff" },
  { key: "deliver",   label: "DELIVER",   emoji: "🚀", color: "#39ff14" },
];

interface WebsiteKanbanProps {
  projects: WebsiteProject[];
  onRefresh: () => void;
  onCardClick: (project: WebsiteProject) => void;
}

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id, data: { stage: id } });
  return <div ref={setNodeRef} className="flex-1 flex flex-col gap-2">{children}</div>;
}

export function WebsiteKanban({ projects, onRefresh, onCardClick }: WebsiteKanbanProps) {
  const [items, setItems] = useState<WebsiteProject[]>(projects);
  const [activeProject, setActiveProject] = useState<WebsiteProject | null>(null);
  const { transition, trigger: triggerTransition, clear: clearTransition } = useStageTransition();
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    setItems(projects);
  }, [projects]);

  const stageOrder = WEBSITE_STAGES.map(s => s.key);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function getStageColor(stage: string) {
    return WEBSITE_STAGES.find(s => s.key === stage)?.color || "#8899aa";
  }

  function getProjectsByStage(stage: string) {
    return items.filter(p => p.stage === stage);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveProject(null);
    if (!over || active.id === over.id) return;

    const targetStage = over.data?.current?.stage || (stageOrder.includes(over.id as string) ? over.id as string : null);
    if (!targetStage) return;

    const project = items.find(p => p.id === active.id);
    if (!project || project.stage === targetStage) return;

    const fromIdx = stageOrder.indexOf(project.stage);
    const toIdx = stageOrder.indexOf(targetStage);

    if (toIdx <= fromIdx) {
      toast("Cannot move backward — projects advance forward through the pipeline", "warning");
      return;
    }

    // Only allow advancing one stage at a time
    if (toIdx !== fromIdx + 1) {
      toast("Projects can only advance one stage at a time", "warning");
      return;
    }

    // Get column positions for animation
    const fromCol = columnRefs.current[project.stage];
    const toCol = columnRefs.current[targetStage];
    const fromColor = getStageColor(project.stage);
    const toColor = getStageColor(targetStage);

    // Optimistic update
    setItems(prev => prev.map(p => p.id === project.id ? { ...p, stage: targetStage } : p));

    // Trigger transition animation
    if (fromCol && toCol) {
      const fromRect = fromCol.getBoundingClientRect();
      const toRect = toCol.getBoundingClientRect();
      triggerTransition({
        id: project.id,
        title: project.client_name,
        fromColor,
        toColor,
        fromX: fromRect.left + fromRect.width / 2,
        fromY: fromRect.top + fromRect.height / 3,
        toX: toRect.left + toRect.width / 2,
        toY: toRect.top + toRect.height / 3,
      });
    }

    try {
      await advanceWebsiteProject(project.id, `Advanced from ${project.stage} to ${targetStage} via dashboard`);
      toast(`"${project.client_name}" advanced to ${targetStage.toUpperCase()}`, "success");
      onRefresh();
    } catch (err: any) {
      // Snap back
      setItems(prev => prev.map(p => p.id === project.id ? { ...p, stage: project.stage } : p));
      toast(`Cannot advance: ${err.body?.detail || err.message}`, "error");
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e: DragStartEvent) => setActiveProject(items.find(p => p.id === e.active.id) || null)}
      onDragEnd={handleDragEnd}
    >
      <div
        className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory lg:snap-none"
        style={{ minHeight: "calc(100vh - 220px)", WebkitOverflowScrolling: "touch" }}
      >
        {WEBSITE_STAGES.map(({ key, label, emoji, color }) => {
          const stageProjects = getProjectsByStage(key);
          return (
            <div
              key={key}
              ref={el => { columnRefs.current[key] = el; }}
              className="flex flex-col shrink-0 rounded-lg overflow-hidden snap-center"
              style={{
                width: 260,
                minWidth: 260,
                background: "#0a0e14",
                border: `1px solid ${color}18`,
              }}
            >
              {/* Column header */}
              <div
                className="flex items-center justify-between px-3 py-2.5"
                style={{
                  borderBottom: `2px solid ${color}`,
                  background: `${color}06`,
                }}
              >
                <span
                  className="font-mono font-bold flex items-center gap-1.5"
                  style={{ color, fontSize: "0.65rem", letterSpacing: "0.12em", textShadow: `0 0 8px ${color}50` }}
                >
                  <span>{emoji}</span>
                  {label}
                </span>
                <span
                  className="font-mono w-5 h-5 flex items-center justify-center rounded-full"
                  style={{ background: `${color}18`, color, fontSize: "0.65rem", border: `1px solid ${color}30` }}
                >
                  {stageProjects.length}
                </span>
              </div>

              {/* Cards */}
              <DroppableColumn id={key}>
                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
                  <SortableContext
                    items={stageProjects.map(p => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {stageProjects.length === 0 ? (
                      <div
                        className="flex flex-col items-center justify-center py-8 rounded-lg"
                        style={{ border: `1px dashed ${color}20`, color: `${color}40` }}
                      >
                        <div className="font-mono text-xs" style={{ fontSize: "0.6rem", letterSpacing: "0.08em" }}>
                          EMPTY
                        </div>
                      </div>
                    ) : (
                      stageProjects.map(project => (
                        <WebsiteCard
                          key={project.id}
                          project={project}
                          stageColor={color}
                          isDragging={activeProject?.id === project.id}
                          onClick={() => onCardClick(project)}
                        />
                      ))
                    )}
                  </SortableContext>
                </div>
              </DroppableColumn>
            </div>
          );
        })}

        {/* Archived — minimal collapsed column */}
        {(() => {
          const archivedCount = items.filter(p => p.stage === "archived").length;
          return (
            <div
              className="flex flex-col shrink-0 rounded-lg overflow-hidden opacity-40 hover:opacity-60 transition-opacity"
              style={{ width: 56, background: "#0a0e14", border: "1px solid #1e2d3d" }}
            >
              <div
                className="flex flex-col items-center gap-2 py-4 px-1"
                style={{ borderTop: "2px solid #445566" }}
              >
                <span
                  className="font-mono w-6 h-6 flex items-center justify-center rounded-full"
                  style={{ background: "#44556618", color: "#445566", fontSize: "0.6rem", border: "1px solid #44556630" }}
                >
                  {archivedCount}
                </span>
                <span
                  className="font-mono font-bold"
                  style={{ color: "#445566", fontSize: "0.5rem", letterSpacing: "0.1em", writingMode: "vertical-lr", textOrientation: "mixed" }}
                >
                  ARCHIVE
                </span>
              </div>
            </div>
          );
        })()}
      </div>

      <DragOverlay>
        {activeProject && (
          <WebsiteCardOverlay project={activeProject} stageColor={getStageColor(activeProject.stage)} />
        )}
      </DragOverlay>

      {/* Stage transition animation overlay */}
      <StageTransitionOverlay
        transition={transition}
        onComplete={clearTransition}
      />
    </DndContext>
  );
}
