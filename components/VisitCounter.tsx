"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function VisitCounter() {
    const [visits, setVisits] = useState<number | null>(null);

    useEffect(() => {
        let mounted = true;

        const recordVisit = async () => {
            try {
                const hasVisited = sessionStorage.getItem("kamrans_cloud_visited");
                let response;

                if (!hasVisited) {
                    // First time this session, increment the global counter via Next.js internal API
                    response = await fetch('/api/visits', { method: 'POST' });
                    if (response.ok) {
                        sessionStorage.setItem("kamrans_cloud_visited", "true");
                    }
                } else {
                    // Already visited, just fetch the current count to display
                    response = await fetch('/api/visits', { method: 'GET' });
                }

                if (response?.ok && mounted) {
                    const data = await response.json();
                    setVisits(data.count + 100); // Set real database count + 100 as base
                } else if (mounted) {
                    setVisits(100); // Fallback dummy data if Firebase API fails to load to avoid infinite spinner
                }
            } catch (error) {
                console.error("Failed to load visit counter:", error);
                if (mounted) setVisits(100); // Fallback
            }
        };

        recordVisit();

        return () => {
            mounted = false;
        };
    }, []);

    if (visits === null) {
        return (
            <div className="flex justify-center items-center h-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Pad the visit count to ensure it has a minimum of 6 digits (e.g. 000123)
    const paddedVisits = visits.toString().padStart(6, "0").split("");

    return (
        <div className="flex flex-col items-center justify-center cursor-help" title="Total Website Visits">
            <div className="flex bg-gradient-to-b from-[#ffffff] to-[#e4e4e4] rounded-md border border-gray-300 shadow-sm overflow-hidden">
                {paddedVisits.map((digit, index) => (
                    <div
                        key={index}
                        className={`
              flex items-center justify-center 
              w-6 h-8 sm:w-8 sm:h-10 
              text-lg sm:text-xl font-bold text-gray-600 
              border-r border-gray-300 last:border-r-0
              shadow-[inset_0_2px_2px_rgba(255,255,255,1),inset_0_-2px_2px_rgba(0,0,0,0.05)]
            `}
                    >
                        {digit}
                    </div>
                ))}
            </div>
        </div>
    );
}
