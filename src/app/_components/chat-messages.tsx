"use client";
import { cn } from "@/lib/utils";
import { useMainStore } from "../store/mainStore";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "motion/react";

export default function ChatMessages({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { currentMessages, loading, sidebarExpanded } = useMainStore();
  return (
    <motion.div
      animate={{
        width: sidebarExpanded ? "calc(100% - 336px)" : "calc(100% - 32px)",
      }}
      className="z-0 mt-4 mr-4 ml-auto flex h-[calc(100vh-148px-2vh)] w-full flex-grow flex-col gap-4 overflow-y-scroll"
    >
      {!currentMessages.length && !loading && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-center text-white/80">
          {!isLoggedIn ? (
            <>
              <div className="text-2xl font-semibold">
                Welcome to Arc Chat AI
              </div>
              <div className="max-w-md text-sm">
                Please log in to start chatting with our AI assistant and
                explore the full capabilities of our platform.
              </div>
            </>
          ) : (
            <>
              <div className="text-2xl font-semibold">Ready to Chat</div>
              <div className="max-w-md text-sm">
                Type your message in the chat box below to get started. Our AI
                assistant is here to help you with any questions or tasks.
              </div>
            </>
          )}
        </div>
      )}
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
          <Skeleton className="me-auto h-8 w-full max-w-sm" />
          <Skeleton className="mt-4 h-24 w-full" />
        </div>
      )}
    </motion.div>
  );
}
