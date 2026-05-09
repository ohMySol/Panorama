"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardGraph } from "../src/components/dashboard/dashboard-graph";
import { LeftTab } from "../src/components/dashboard/left-tab";
import { RightTab } from "../src/components/dashboard/right-tab";
import { useLatestGraphAnalysis } from "@/lib/hooks/useGraphAnalysis";

export default function DashboardPage() {
  const { data, isLoading, error } = useLatestGraphAnalysis();
  const router = useRouter();

  useEffect(() => {
    // Redirect to home if no data available
    if (!isLoading && !data) {
      router.push("/");
    }
  }, [data, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex flex-1 border-t border-t-gray-400 w-full h-screen items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 border-t border-t-gray-400 w-full h-screen items-center justify-center">
        <div className="text-red-500">Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 border-t border-t-gray-400 w-full h-screen">
      <LeftTab />
      <DashboardGraph />
      <RightTab />
    </div>
  );
}
