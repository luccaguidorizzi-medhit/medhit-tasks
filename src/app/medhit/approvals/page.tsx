"use client";

import React from "react";
import { useTasks } from "@/context/task-context";
import { ApprovalsPanel } from "@/components/agents/approvals-panel";

export default function ApprovalsPage() {
  const { approvals, reviewApproval } = useTasks();

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <ApprovalsPanel
        approvals={approvals}
        onReview={reviewApproval}
      />
    </div>
  );
}
