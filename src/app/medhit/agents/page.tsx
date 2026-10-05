"use client";

import React from "react";
import { useTasks } from "@/context/task-context";
import { AgentsPanel } from "@/components/agents/agents-panel";

export default function AgentsPage() {
  const { agents, agentRuns, triggerClaim } = useTasks();

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <AgentsPanel
        agents={agents}
        runs={agentRuns}
        onTriggerClaim={triggerClaim}
      />
    </div>
  );
}
