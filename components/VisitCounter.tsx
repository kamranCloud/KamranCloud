"use client";

import { useEffect, useState } from "react";
import { Users, Loader2 } from "lucide-react";

export default function VisitCounter() {
    const [visits, setVisits] = useState<number | null>(null);

    useEffect(() => {
        let mounted = true;

        const recordVisit = async () => {
            try {
                const hasVisited = sessionStorage.getItem("kamrans_cloud_visited");
                let response;

                if (!hasVisited) {
                    // First time this session, increment the global counter
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
                    setVisits(data.count);
                }
            } catch (error) {
                console.error("Failed to load visit counter:", error);
            }
        };

        recordVisit();

        return () => {
            mounted = false;
        };
    }, []);

    return (
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border-2 border-primary/20 text-primary rounded-full text-sm font-semibold shadow-sm hover:scale-105 transition-transform cursor-help" title="Total unique visitors">
            <Users className="w-4 h-4" />
            <span>Total Visits: {visits === null ? <Loader2 className="w-3 h-3 animate-spin inline ml-1" /> : visits.toLocaleString()}</span>
        </div>
    );
}
