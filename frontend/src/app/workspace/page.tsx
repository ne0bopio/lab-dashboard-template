"use client";
import { PageTitle } from "@/components/ui/PageTitle";
import { PageTransition } from "@/components/ui/PageTransition";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";

export default function Workspace() {
  return (
    <>
      <PageTitle title="Workspace" />
      <PageTransition>
        <WorkspacePage />
      </PageTransition>
    </>
  );
}
