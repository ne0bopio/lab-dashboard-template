"use client";
import { PageTitle } from "@/components/ui/PageTitle";
import { PageTransition } from "@/components/ui/PageTransition";
import { KanbanBoardPage } from "@/components/tasks/KanbanBoard";

export default function Tasks() {
  return (
    <>
      <PageTitle title="Tasks" />
      <PageTransition>
        <div className="px-4 sm:px-6 py-4">
          {/* Header */}
          <div className="mb-6">
            <h1
              className="font-display font-bold tracking-wider"
              style={{
                fontSize: "1.2rem",
                color: "#ffb347",
                textShadow: "0 0 20px rgba(255,179,71,0.3)",
              }}
            >
              ⚡ TASK BOARD
            </h1>
            <p className="font-mono mt-1" style={{ fontSize: "0.68rem", color: "#445566" }}>
              Drag tasks between columns • Click to edit
            </p>
          </div>

          <KanbanBoardPage />
        </div>
      </PageTransition>
    </>
  );
}
