"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home if accessing /dashboard without address
    router.push("/");
  }, [router]);

  return (
    <div className="flex flex-1 border-t border-t-gray-400 w-full h-screen items-center justify-center">
      <div className="text-white">Redirecting...</div>
    </div>
  );
}
