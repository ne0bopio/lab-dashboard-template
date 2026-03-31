"use client";
import { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getIdeaRoom, getDevRoom } from "@/lib/api";
import { IDEA_ROOM_STAGES, DEV_ROOM_STAGES } from "@/components/ideas/KanbanBoard";

const KanbanBoard = dynamic(
  () => import("@/components/ideas/KanbanBoard").then(m => m.KanbanBoard),
  { ssr: false }
);
import { NewIdeaModal } from "@/components/ideas/NewIdeaModal";
import { ToastContainer } from "@/components/ui/Toast";
import { Plus, RefreshCw } from "lucide-react";
import { SkeletonKanban } from "@/components/ui/Skeleton";
import { PageTitle } from "@/components/ui/PageTitle";
import { PageTransition } from "@/components/ui/PageTransition";

type RoomType = "idea" | "dev";

function IdeasPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Tab state from URL params — default to "idea"
  const roomParam = searchParams.get("room");
  const activeRoom: RoomType = roomParam === "dev" ? "dev" : "idea";

  // Fetch both rooms
  const {
    data: ideaRoomData,
    isLoading: ideaLoading,
    refetch: refetchIdea,
  } = useQuery({
    queryKey: ["ideas", "idea-room"],
    queryFn: () => getIdeaRoom(),
    refetchInterval: 15000,
  });

  const {
    data: devRoomData,
    isLoading: devLoading,
    refetch: refetchDev,
  } = useQuery({
    queryKey: ["ideas", "dev-room"],
    queryFn: () => getDevRoom(),
    refetchInterval: 15000,
  });

  // Listen for keyboard shortcut 'n'
  useEffect(() => {
    const handler = () => setShowModal(true);
    window.addEventListener("lab-new-idea", handler);
    return () => window.removeEventListener("lab-new-idea", handler);
  }, []);

  const ideaList = Array.isArray(ideaRoomData) ? ideaRoomData : [];
  const devList  = Array.isArray(devRoomData)  ? devRoomData  : [];
  const totalIdea = ideaList.filter((i: any) => i.stage !== "archived").length;
  const totalDev  = devList.length;

  function handleRefresh() {
    queryClient.invalidateQueries({ queryKey: ["ideas"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }

  const isLoading = activeRoom === "idea" ? ideaLoading : devLoading;
  const rawIdeas   = activeRoom === "idea" ? ideaList : devList;
  const currentStages = activeRoom === "idea" ? IDEA_ROOM_STAGES : DEV_ROOM_STAGES;

  // Collect all unique tags from this room's ideas
  const allTags: string[] = Array.from(
    new Set(rawIdeas.flatMap((i: any) => i.tags || []))
  ).sort() as string[];

  // Filter ideas by active tag (client-side)
  const currentIdeas = activeTag
    ? rawIdeas.filter((i: any) => (i.tags || []).includes(activeTag))
    : rawIdeas;

  // Reset tag filter when switching rooms
  function setRoom(room: RoomType) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("room", room);
    router.push(`?${params.toString()}`, { scroll: false });
    setActiveTag(null);
  }

  return (
    <PageTransition>
      <div className="p-4 flex flex-col gap-4" style={{ minHeight: "calc(100vh - 80px)" }}>
        <PageTitle title="Ideas" />
        <ToastContainer />

        {/* Header */}
        <div className="flex flex-col gap-3">
          {/* Title row */}
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1
                style={{
                  fontFamily: "Orbitron, monospace",
                  color: "#ffb347",
                  fontSize: "1rem",
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textShadow: "0 0 12px rgba(255,179,71,0.35)",
                }}
              >
                IDEA PROCESSING ROOM
              </h1>
              <p className="font-mono mt-1" style={{ color: "#445566", fontSize: "0.6rem", letterSpacing: "0.08em" }}>
                {totalIdea} IDEA ROOM · {totalDev} DEV ROOM · RAW THOUGHT → LAUNCHED PRODUCT
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-xs transition-all hover:opacity-80"
                style={{
                  background: "rgba(255,179,71,0.05)",
                  color: "#445566",
                  border: "1px solid #1e2d3d",
                  fontSize: "0.65rem",
                }}
              >
                <RefreshCw size={10} />
                REFRESH
              </button>
              {activeRoom === "idea" && (
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded font-mono text-xs font-semibold transition-all hover:-translate-y-0.5"
                  style={{
                    background: "rgba(255,179,71,0.12)",
                    color: "#ffb347",
                    border: "1px solid rgba(255,179,71,0.35)",
                    boxShadow: "0 0 12px rgba(255,179,71,0.1)",
                    fontSize: "0.7rem",
                    letterSpacing: "0.1em",
                  }}
                >
                  <Plus size={12} /> NEW IDEA
                </button>
              )}
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-1" style={{ borderBottom: "1px solid #1e2d3d" }}>
            <TabButton
              label="💡 Idea Room"
              count={totalIdea}
              active={activeRoom === "idea"}
              onClick={() => setRoom("idea")}
              activeColor="#ffb347"
            />
            <TabButton
              label="🔧 Dev Room"
              count={totalDev}
              active={activeRoom === "dev"}
              onClick={() => setRoom("dev")}
              activeColor="#2979ff"
            />
          </div>
        </div>

        {/* Board */}
        {isLoading && currentIdeas.length === 0 ? (
          <SkeletonKanban />
        ) : (
          <KanbanBoard
            initialIdeas={currentIdeas}
            stages={currentStages}
            onRefresh={handleRefresh}
            roomType={activeRoom}
          />
        )}

        {showModal && (
          <NewIdeaModal
            onClose={() => setShowModal(false)}
            onCreated={handleRefresh}
          />
        )}
      </div>
    </PageTransition>
  );
}

// ── Tab Button ─────────────────────────────────────────────────────────────
function TabButton({
  label,
  count,
  active,
  onClick,
  activeColor,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  activeColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 font-mono transition-all relative"
      style={{
        fontSize: "0.68rem",
        letterSpacing: "0.08em",
        color: active ? activeColor : "#445566",
        background: active ? `${activeColor}08` : "transparent",
        borderBottom: active
          ? `2px solid ${activeColor}`
          : "2px solid transparent",
        textShadow: active ? `0 0 10px ${activeColor}60` : "none",
        marginBottom: "-1px",
      }}
    >
      {label}
      <span
        className="font-mono px-1.5 py-0.5 rounded-full"
        style={{
          background: active ? `${activeColor}18` : "#1e2d3d",
          color: active ? activeColor : "#445566",
          border: `1px solid ${active ? activeColor + "30" : "#1e2d3d"}`,
          fontSize: "0.55rem",
          minWidth: "1.4rem",
          textAlign: "center",
        }}
      >
        {count}
      </span>
    </button>
  );
}

// ── Page export with Suspense for useSearchParams ──────────────────────────
export default function IdeasPage() {
  return (
    <Suspense fallback={<div className="p-4 font-mono text-xs" style={{ color: "#445566" }}>LOADING...</div>}>
      <IdeasPageInner />
    </Suspense>
  );
}
