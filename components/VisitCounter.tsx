"use client";

import { motion } from "framer-motion";

export default function VisitCounter() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex flex-col items-center justify-center"
        >
            {/* Hidden iframe to trigger the tracking logic without breaking Next.js hydration via document.write */}
            <iframe
                src="https://www.freevisitorcounters.com/auth.php?id=1f509f2c3add916c6ad965517f751ca13845693d"
                style={{ display: "none" }}
                title="Visitor Analytics"
            />

            {/* Extracted actual image counter to safely render in React */}
            <a
                href="https://www.freevisitorcounters.com/en/home/stats/id/1518168"
                target="_blank"
                rel="noopener noreferrer"
                title="View Profile Stats"
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="https://www.freevisitorcounters.com/en/counter/render/1518168/t/5"
                    alt="Visitor Counter"
                    style={{ border: "0" }}
                    className="hover:scale-105 transition-transform cursor-pointer"
                />
            </a>

            {/* Required Backlink from user's snippet */}
            <a
                href="https://free-hit-counters.net/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-muted-foreground mt-1 opacity-40 hover:opacity-100 transition-opacity"
            >
                Free-Hit-Counters
            </a>
        </motion.div>
    );
}
