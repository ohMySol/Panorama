"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBuildGraph } from "@/lib/hooks/useGraphAnalysis";
import { validateBuildGraphRequest } from "@/lib/validation/address.validation";
import { API_CONFIG } from "@/lib/config/api.config";

export const ScanInput = () => {
    const [address, setAddress] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();
    const mutation = useBuildGraph();

    const handleSubmit = () => {
        setError("");

        // Validate request
        const validation = validateBuildGraphRequest({
            address,
            chain_id: API_CONFIG.SUPPORTED_CHAINS.ethereum,
            depth: API_CONFIG.DEFAULT_DEPTH,
        });

        if (!validation.isValid) {
            setError(validation.error || "Invalid input");
            return;
        }

        // Make API request
        mutation.mutate(
            {
                address,
                chain_id: API_CONFIG.SUPPORTED_CHAINS.ethereum,
                depth: API_CONFIG.DEFAULT_DEPTH,
            },
            {
                onSuccess: () => {
                    router.push("/dashboard");
                },
                onError: (err) => {
                    setError(err.message || "Failed to analyze contract");
                },
            }
        );
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center w-[560px] h-[50px]">
                <div className="flex items-center justify-center gap-2 px-5 py-2 h-full border border-gray-700">
                    <div className="w-2 h-2 bg-[#C8F3EE]"></div>
                    Scan
                </div>
                <input
                    placeholder="0xA1D94F746dEfa1928926b84fB2596c06926C0405"
                    className="px-4 text-[14px] flex-1 h-full border border-gray-700 text-white placeholder:text-gray-500 ring-o outline-none bg-transparent"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={mutation.isPending}
                />
                <button
                    onClick={handleSubmit}
                    disabled={mutation.isPending || !address}
                    className="font-display cursor-pointer px-5 py-2 h-full text-black bg-[#C8FF3E] hover:bg-[#d1fa69] border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {mutation.isPending ? "Analyzing..." : "Analyze"}
                </button>
            </div>
            {error && (
                <div className="text-red-500 text-sm">{error}</div>
            )}
        </div>
    );
};
