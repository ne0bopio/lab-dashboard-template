"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getWebsiteProjects } from "@/lib/api";
import { WEBSITE_STAGES } from "@/components/websites/WebsiteKanban";
import type { WebsiteProject } from "@/components/websites/WebsiteCard";

const WebsiteKanban = dynamic(
  () => import("@/components/websites/WebsiteKanban").then(m => m.WebsiteKanban),
  { ssr: false }
);
import { NewWebsiteModal } from "@/components/websites/NewWebsiteModal";
import { WebsiteDetailModal } from "@/components/websites/WebsiteDetailModal";
import { ToastContainer } from "@/components/ui/Toast";
import { Plus, RefreshCw } from "lucide-react";
import { SkeletonKanban } from "@/components/ui/Skeleton";
import { PageTitle } from "@/components/ui/PageTitle";
import { PageTransition } from "@/components/ui/PageTransition";

export default function WebsitesPage() {
  const queryClient = useQueryClient();
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<WebsiteProject | null>(null);

  const {
    data: projects,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["websites"],
    queryFn: () => getWebsiteProjects(),
    refetchInterval: 15000,
  });

  // Listen for keyboard shortcut 'n'
  useEffect(() => {
    const handler = () => setShowNewModal(true);
    window.addEventListener("lab-new-website", handler);
    return () => window.removeEventListener("lab-new-website", handler);
  }, []);

  const projectList: WebsiteProject[] = Array.isArray(projects) ? projects : [];
  const activeProjects = projectList.filter(p => p.stage !== "archived");
  const accentColor = "#00e5ff";

  // Count per stage
  const stageCounts = WEBSITE_STAGES.reduce<Record<string, number>>((acc, s) => {
    acc[s.key] = projectList.filter(p => p.stage === s.key).length;
    return acc;
  }, {});

  function handleRefresh() {
    queryClient.invalidateQueries({ queryKey: ["websites"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }

  function getStageColor(stage: string) {
    return WEBSITE_STAGES.find(s => s.key === stage)?.color || "#8899aa";
  }

  return (
    <PageTransition>
      <div className="p-4 flex flex-col gap-4" style={{ minHeight: "calc(100vh - 80px)" }}>
        <PageTitle title="Website Pipeline" />
        <ToastContainer />

        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1
                style={{
                  fontFamily: "Orbitron, monospace",
                  color: accentColor,
                  fontSize: "1rem",
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textShadow: `0 0 12px ${accentColor}35`,
                }}
              >
                🌐 WEBSITE PIPELINE
              </h1>
              <p className="font-mono mt-1" style={{ color: "#445566", fontSize: "0.6rem", letterSpacing: "0.08em" }}>
                {activeProjects.length} ACTIVE PROJECT{activeProjects.length !== 1 ? "S" : ""} · INTAKE → DELIVER
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-xs transition-all hover:opacity-80"
                style={{
                  background: `${accentColor}05`,
                  color: "#445566",
                  border: "1px solid #1e2d3d",
                  fontSize: "0.65rem",
                }}
              >
                <RefreshCw size={10} />
                REFRESH
              </button>
              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded font-mono text-xs font-semibold transition-all hover:-translate-y-0.5"
                style={{
                  background: `${accentColor}12`,
                  color: accentColor,
                  border: `1px solid ${accentColor}35`,
                  boxShadow: `0 0 12px ${accentColor}10`,
                  fontSize: "0.7rem",
                  letterSpacing: "0.1em",
                }}
              >
                <Plus size={12} /> NEW PROJECT
              </button>
            </div>
          </div>

          {/* Stage summary pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {WEBSITE_STAGES.map(({ key, label, emoji, color }) => (
              <span
                key={key}
                className="flex items-center gap-1 px-2 py-1 rounded font-mono"
                style={{
                  background: stageCounts[key] > 0 ? `${color}10` : "transparent",
                  color: stageCounts[key] > 0 ? color : "#2a3a4a",
                  border: `1px solid ${stageCounts[key] > 0 ? color + "25" : "#1e2d3d"}`,
                  fontSize: "0.52rem",
                  letterSpacing: "0.06em",
                }}
              >
                {emoji} {label}
                <span
                  className="ml-0.5 px-1 py-0 rounded-full"
                  style={{
                    background: stageCounts[key] > 0 ? `${color}20` : "transparent",
                    fontSize: "0.5rem",
                  }}
                >
                  {stageCounts[key]}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Board */}
        {isLoading && projectList.length === 0 ? (
          <SkeletonKanban />
        ) : (
          <WebsiteKanban
            projects={projectList}
            onRefresh={handleRefresh}
            onCardClick={setSelectedProject}
          />
        )}

        {/* Modals */}
        {showNewModal && (
          <NewWebsiteModal
            onClose={() => setShowNewModal(false)}
            onCreated={handleRefresh}
          />
        )}

        {selectedProject && (
          <WebsiteDetailModal
            project={selectedProject}
            stageColor={getStageColor(selectedProject.stage)}
            onClose={() => setSelectedProject(null)}
          />
        )}
      </div>
    </PageTransition>
  );
}
