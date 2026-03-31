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
import { IdeaCard, IdeaCardOverlay } from "./IdeaCard";
import { advanceIdea, blockIdea, getIdeas } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import { Plus } from "lucide-react";
import { useStageTransition, StageTransitionOverlay } from "./StageTransition";
import { RawBrewing } from "./RawBrewing";
import { DesignQueue } from "./DesignQueue";

export interface StageConfig {
  key: string;
  label: string;
  emoji: string;
  color: string;
}

export const IDEA_ROOM_STAGES: StageConfig[] = [
  { key: "raw",           label: "RAW",           emoji: "🆕", color: "#ffb347" },
  { key: "research",      label: "RESEARCH",      emoji: "🔍", color: "#00e5ff" },
  { key: "validation",    label: "VALIDATION",    emoji: "⚖️", color: "#bf5fff" },
  { key: "business_plan", label: "BUSINESS PLAN", emoji: "📋", color: "#39ff14" },
  { key: "approved",      label: "APPROVED",      emoji: "✅", color: "#22c55e" },
];

export const DEV_ROOM_STAGES: StageConfig[] = [
  { key: "queue",       label: "FORGE",       emoji: "⚗️", color: "#ff2d8a" },
  { key: "design",      label: "DESIGN",      emoji: "🎨", color: "#ff2d8a" },
  { key: "development", label: "DEVELOPMENT", emoji: "💻", color: "#2979ff" },
  { key: "testing",     label: "TESTING",     emoji: "🧪", color: "#f59e0b" },
  { key: "launched",    label: "LAUNCHED",    emoji: "🚀", color: "#22c55e" },
];

type Ideas = any[];

interface KanbanBoardProps {
  initialIdeas: Ideas;
  stages: StageConfig[];
  onRefresh: () => void;
  roomType: "idea" | "dev";
}

export function KanbanBoard({ initialIdeas, stages, onRefresh, roomType }: KanbanBoardProps) {
  const [ideas, setIdeas] = useState<Ideas>(initialIdeas);
  const [activeIdea, setActiveIdea] = useState<any | null>(null);
  const [rawExpanded, setRawExpanded] = useState(false);
  const [rawPage, setRawPage] = useState(0);
  const RAW_PER_PAGE = 4;
  const { transition, trigger: triggerTransition, clear: clearTransition } = useStageTransition();
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Sync when parent refreshes data or tab switches
  useEffect(() => {
    setIdeas(initialIdeas);
  }, [initialIdeas]);

  const stageOrder = stages.map(s => s.key);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function getStageColor(stage: string) {
    return stages.find(s => s.key === stage)?.color || "#8899aa";
  }

  function getIdeasByStage(stage: string) {
    return ideas.filter(i => i.stage === stage);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveIdea(null);
    if (!over || active.id === over.id) return;

    const targetStage = over.data?.current?.stage || (stageOrder.includes(over.id as string) ? over.id as string : null);
    if (!targetStage) return;

    const idea = ideas.find(i => i.id === active.id);
    if (!idea || idea.stage === targetStage) return;

    const fromIdx = stageOrder.indexOf(idea.stage);
    const toIdx   = stageOrder.indexOf(targetStage);

    if (toIdx <= fromIdx) {
      toast("Move backward not supported — archive or block instead", "warning");
      return;
    }

    // Get column positions for animation
    const fromCol = columnRefs.current[idea.stage];
    const toCol = columnRefs.current[targetStage];
    const fromColor = getStageColor(idea.stage);
    const toColor = getStageColor(targetStage);

    // Optimistic update
    setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, stage: targetStage } : i));

    // Trigger transition animation if we have column refs
    if (fromCol && toCol) {
      const fromRect = fromCol.getBoundingClientRect();
      const toRect = toCol.getBoundingClientRect();
      triggerTransition({
        id: idea.id,
        title: idea.title,
        fromColor,
        toColor,
        fromX: fromRect.left + fromRect.width / 2,
        fromY: fromRect.top + fromRect.height / 3,
        toX: toRect.left + toRect.width / 2,
        toY: toRect.top + toRect.height / 3,
      });
    }

    try {
      await advanceIdea(idea.id, `Moved from ${idea.stage} to ${targetStage} via Kanban`);
      toast(`"${idea.title}" advanced to ${targetStage.toUpperCase()}`, "success");
      onRefresh();
    } catch (err: any) {
      // Snap back
      setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, stage: idea.stage } : i));
      const missingFields = err.body?.detail || err.message;
      toast(`Cannot advance: ${missingFields}`, "error");
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e: DragStartEvent) => setActiveIdea(ideas.find(i => i.id === e.active.id) || null)}
      onDragEnd={handleDragEnd}
    >
      <div
        className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory lg:snap-none"
        style={{ minHeight: "calc(100vh - 220px)", WebkitOverflowScrolling: "touch" }}
      >
        {stages.map(({ key, label, emoji, color }) => {
          const stageIdeas = getIdeasByStage(key);
          return (
            <div
              key={key}
              ref={el => { columnRefs.current[key] = el; }}
              className="flex flex-col shrink-0 rounded-lg overflow-hidden snap-center"
              style={{
                width: 240,
                minWidth: 240,
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
                  {stageIdeas.length}
                </span>
              </div>

              {/* View toggle — only for raw column with 3+ ideas */}
              {key === "raw" && stageIdeas.length >= 3 && (
                <div className="flex items-center px-2 py-1.5" style={{ borderBottom: `1px solid ${color}10` }}>
                  <button
                    onClick={() => { setRawExpanded(false); setRawPage(0); }}
                    className="font-mono px-2 py-1 rounded transition-all"
                    style={{
                      fontSize: "0.55rem",
                      letterSpacing: "0.06em",
                      color: !rawExpanded ? color : "#445566",
                      background: !rawExpanded ? `${color}15` : "transparent",
                      border: !rawExpanded ? `1px solid ${color}30` : "1px solid transparent",
                    }}
                  >
                    ◉ BREW
                  </button>
                  <button
                    onClick={() => setRawExpanded(true)}
                    className="font-mono px-2 py-1 rounded transition-all ml-1"
                    style={{
                      fontSize: "0.55rem",
                      letterSpacing: "0.06em",
                      color: rawExpanded ? color : "#445566",
                      background: rawExpanded ? `${color}15` : "transparent",
                      border: rawExpanded ? `1px solid ${color}30` : "1px solid transparent",
                    }}
                  >
                    ≡ LIST
                  </button>
                </div>
              )}

              {/* Cards — Brewing, Design Queue, or Paginated List */}
              {key === "queue" ? (
                <div className="flex-1 overflow-hidden p-2">
                  <DesignQueue ideas={stageIdeas} />
                </div>
              ) : key === "raw" && stageIdeas.length >= 3 && !rawExpanded ? (
                <RawBrewing
                  ideas={stageIdeas}
                  onExpand={() => setRawExpanded(true)}
                />
              ) : (
                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
                  <SortableContext
                    items={stageIdeas.map(i => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {stageIdeas.length === 0 ? (
                      <div
                        className="flex flex-col items-center justify-center py-8 rounded-lg"
                        style={{ border: `1px dashed ${color}20`, color: `${color}40` }}
                      >
                        <div className="font-mono text-xs" style={{ fontSize: "0.6rem", letterSpacing: "0.08em" }}>
                          EMPTY
                        </div>
                      </div>
                    ) : key === "raw" && stageIdeas.length >= 3 ? (
                      /* Paginated raw list */
                      <>
                        {stageIdeas.slice(rawPage * RAW_PER_PAGE, (rawPage + 1) * RAW_PER_PAGE).map(idea => (
                          <IdeaCard
                            key={idea.id}
                            idea={idea}
                            stageColor={color}
                            isDragging={activeIdea?.id === idea.id}
                          />
                        ))}
                        {/* Pagination controls */}
                        {stageIdeas.length > RAW_PER_PAGE && (
                          <div className="flex items-center justify-between pt-1">
                            <button
                              onClick={() => setRawPage(p => Math.max(0, p - 1))}
                              disabled={rawPage === 0}
                              className="font-mono transition-opacity"
                              style={{
                                fontSize: "0.55rem",
                                color: rawPage === 0 ? "#1e2d3d" : color,
                                cursor: rawPage === 0 ? "default" : "pointer",
                                background: "none",
                                border: "none",
                                padding: "2px 4px",
                              }}
                            >
                              ◄ PREV
                            </button>
                            <span className="font-mono" style={{ fontSize: "0.5rem", color: "#445566" }}>
                              {rawPage + 1}/{Math.ceil(stageIdeas.length / RAW_PER_PAGE)}
                            </span>
                            <button
                              onClick={() => setRawPage(p => Math.min(Math.ceil(stageIdeas.length / RAW_PER_PAGE) - 1, p + 1))}
                              disabled={rawPage >= Math.ceil(stageIdeas.length / RAW_PER_PAGE) - 1}
                              className="font-mono transition-opacity"
                              style={{
                                fontSize: "0.55rem",
                                color: rawPage >= Math.ceil(stageIdeas.length / RAW_PER_PAGE) - 1 ? "#1e2d3d" : color,
                                cursor: rawPage >= Math.ceil(stageIdeas.length / RAW_PER_PAGE) - 1 ? "default" : "pointer",
                                background: "none",
                                border: "none",
                                padding: "2px 4px",
                              }}
                            >
                              NEXT ►
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      stageIdeas.map(idea => (
                        <IdeaCard
                          key={idea.id}
                          idea={idea}
                          stageColor={color}
                          isDragging={activeIdea?.id === idea.id}
                        />
                      ))
                    )}
                  </SortableContext>
                </div>
              )}

              {/* Add button — only on raw column in idea room */}
              {key === "raw" && roomType === "idea" && (
                <div className="p-2">
                  <button
                    className="w-full flex items-center justify-center gap-1 py-1.5 rounded font-mono text-xs opacity-30 hover:opacity-60 transition-opacity"
                    style={{ border: `1px dashed ${color}30`, color, fontSize: "0.6rem" }}
                    onClick={() => {}}
                  >
                    <Plus size={10} /> ADD
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Archived — minimal collapsed column, idea room only */}
        {roomType === "idea" && (() => {
          const archivedCount = ideas.filter(i => i.stage === "archived").length;
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
                <span className="font-mono font-bold" style={{ color: "#445566", fontSize: "0.5rem", letterSpacing: "0.1em", writingMode: "vertical-lr", textOrientation: "mixed" }}>
                  ARCHIVE
                </span>
              </div>
            </div>
          );
        })()}
      </div>

      <DragOverlay>
        {activeIdea && (
          <IdeaCardOverlay idea={activeIdea} stageColor={getStageColor(activeIdea.stage)} />
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
