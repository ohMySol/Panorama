"use client"

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardGraph } from "../../src/components/dashboard/dashboard-graph";
import { LeftTab } from "../../src/components/dashboard/left-tab";
import { RightTab } from "../../src/components/dashboard/right-tab";
import { useBuildGraph, useLatestGraphAnalysis } from "@/lib/hooks/useGraphAnalysis";
import { SelectedNodeProvider } from "@/lib/context/selected-node.context";
import { validateAddress } from "@/lib/validation/address.validation";
import { API_CONFIG } from "@/lib/config/api.config";

export default function DashboardPage() {
  const params = useParams();
  const address = params.address as string;
  const router = useRouter();
  const { data, isLoading, error } = useLatestGraphAnalysis();
  const mutation = useBuildGraph();

  useEffect(() => {
    // Validate address from URL
    if (!address || !validateAddress(address)) {
      router.push("/");
      return;
    }

    // If no data in cache, fetch it
    if (!isLoading && !data && !mutation.isPending) {
      mutation.mutate({
        address,
        chain_id: API_CONFIG.SUPPORTED_CHAINS.ethereum,
        depth: API_CONFIG.DEFAULT_DEPTH,
      });
    }
  }, [address, data, isLoading, router, mutation]);

  if (isLoading || mutation.isPending) {
    return (
      <div className="flex flex-1 border-t border-t-gray-400 w-full h-screen items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error || mutation.error) {
    return (
      <div className="flex flex-1 border-t border-t-gray-400 w-full h-screen items-center justify-center">
        <div className="text-red-500">Error: {error?.message || mutation.error?.message}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-1 border-t border-t-gray-400 w-full h-screen items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <SelectedNodeProvider>
      <div className="flex flex-1 border-t border-t-gray-400 w-full h-screen">
        <LeftTab />
        <DashboardGraph />
        <RightTab />
      </div>
    </SelectedNodeProvider>
  );
}
