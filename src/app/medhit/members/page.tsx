"use client";

import React from "react";
import { MembersManagement } from "@/components/settings/members-management";

export default function MembersPage() {
  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-y-auto p-8 max-w-5xl mx-auto w-full">
      <MembersManagement />
    </div>
  );
}
