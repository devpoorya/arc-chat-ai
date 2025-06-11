"use client";
import { cn } from "@/lib/utils";
import { useMainStore } from "../store/mainStore";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "motion/react";

export default function ChatMessages() {
  const { currentMessages, loading, sidebarExpanded } = useMainStore();
  return (
    <motion.div
      animate={{
        width: sidebarExpanded ? "calc(100% - 336px)" : "calc(100% - 32px)",
      }}
      className="mt-4 mr-4 ml-auto flex h-[calc(100vh-148px)] w-full flex-grow flex-col gap-4 overflow-y-scroll"
    >
      {currentMessages.map((m, i) => (
        <div
          key={i}
          className={cn(
            "glass flex w-full items-center gap-2 rounded-md border p-4 text-white",
            m.type === "error" && "bg-red-600 font-semibold text-white",
          )}
        >
          <div className="flex-grow">
            {m.content.split("\n").map((l, i) => (
              <div key={i} className="text-sm leading-relaxed">
                {l}
              </div>
            ))}
          </div>
        </div>
      ))}
      {loading && (
        <div className="w-full">
          <Skeleton className="ms-auto h-8 w-full max-w-sm" />
          <Skeleton className="mt-4 h-24 w-full" />
        </div>
      )}
    </motion.div>
  );
}
