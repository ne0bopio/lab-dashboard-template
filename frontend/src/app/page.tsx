"use client";
import { useQuery } from "@tanstack/react-query";
import { getDashboard, getIdeas } from "@/lib/api";
import { AgentGrid }    from "@/components/dashboard/AgentGrid";
import { PipelineMini } from "@/components/dashboard/PipelineMini";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ToolsStatus }  from "@/components/dashboard/ToolsStatus";
import { SystemTicker } from "@/components/dashboard/SystemTicker";
import { CRTBoot }      from "@/components/dashboard/CRTBoot";
import { SYSTEM_LOGS, PIPELINE_COUNTS } from "@/lib/mock-data";
import { SkeletonGrid, SkeletonPanel } from "@/components/ui/Skeleton";
import { PageTitle } from "@/components/ui/PageTitle";
import { PageTransition } from "@/components/ui/PageTransition";

export default function DashboardPage() {
  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    refetchInterval: 15000,
  });

  const { data: ideas } = useQuery({
    queryKey: ["ideas"],
    queryFn: () => getIdeas(),
    refetchInterval: 15000,
  });

  // Build pipeline from real ideas
  const pipeline: Record<string, number> = { raw: 0, research: 0, validation: 0, business_plan: 0, execution: 0, launched: 0, archived: 0 };
  if (ideas && Array.isArray(ideas)) {
    (ideas as any[]).forEach((i: any) => { if (pipeline[i.stage] !== undefined) pipeline[i.stage]++; });
  }

  const agents  = data?.agents?.list || [];
  const tools   = data?.tools?.list  || [];
  const events  = data?.recent_events || [];
  const lastPoll = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("en-US", { hour12: false }) : "";

  return (
    <PageTransition>
    <div className="p-4 flex flex-col gap-3" style={{ maxWidth: "100%", minHeight: "calc(100vh - 80px)" }}>
      <PageTitle title="Dashboard" />
      <CRTBoot />

      {/* Boot banner */}
      <div
        className="flex items-center justify-between px-4 py-2 rounded"
        style={{
          background: "rgba(255,179,71,0.04)",
          border: "1px solid rgba(255,179,71,0.12)",
          fontFamily: "JetBrains Mono, monospace",
          color: "#ffb347",
          fontSize: "0.62rem",
          letterSpacing: "0.08em",
        }}
      >
        <span>⚡ Lab Dashboard v2026.03</span>
        <div className="flex items-center gap-4">
          {lastPoll && <span style={{ color: "#445566" }}>POLLED {lastPoll}</span>}
          <span style={{ color: "#39ff14" }}>● OPERATIONAL</span>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="flex flex-col lg:grid gap-3" style={{ gridTemplateColumns: "1fr 280px" }}>
          <SkeletonGrid count={8} />
          <SkeletonPanel height={300} />
          <SkeletonPanel height={200} />
          <div className="lg:col-span-2"><SkeletonPanel height={80} /></div>
        </div>
      ) : (
        <div className="flex flex-col lg:grid gap-3" style={{ gridTemplateColumns: "1fr 280px" }}>
          <div className="lg:col-start-1 lg:row-start-1">
            <AgentGrid agents={agents} />
          </div>
          <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2">
            <PipelineMini pipeline={Object.keys(pipeline).some(k => pipeline[k] > 0) ? pipeline : PIPELINE_COUNTS} />
          </div>
          <div className="lg:col-start-1 lg:row-start-2">
            <ActivityFeed events={events} />
          </div>
          <div className="lg:col-span-2">
            <ToolsStatus tools={tools} />
          </div>
          <div className="lg:col-span-2">
            <SystemTicker logs={SYSTEM_LOGS} />
          </div>
        </div>
      )}
    </div>
    </PageTransition>
  );
}
