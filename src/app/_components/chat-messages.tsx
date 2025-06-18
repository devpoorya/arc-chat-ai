"use client";
import { cn } from "@/lib/utils";
import { useMainStore } from "../store/mainStore";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "motion/react";
import { GitForkIcon } from "lucide-react";
import { forkThreadAction } from "@/server/actions/prompt-actions";
import { Button } from "@/components/ui/button";

export default function ChatMessages({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { currentMessages, loading, sidebarExpanded, currentThreadId, setThreadsList, threadsList, setCurrentThreadId } = useMainStore();

  const handleFork = async (index: number) => {
    if (!currentThreadId) return;
    
    try {
      const newThread = await forkThreadAction({
        threadId: currentThreadId,
        messageIndex: index,
      });
      
      // Update threads list and switch to new thread
      setThreadsList([newThread, ...threadsList]);
    } catch (error) {
      console.error("Failed to fork thread:", error);
    }
  };

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
              <div key={i} className="text-sm leading-relaxed" style={{ color: "black" }}>
                {l}
              </div>
            ))}
            {m.files && m.files.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {m.files.map((file, index) => (
                  <div key={index} className="relative">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="max-h-48 rounded-md"
                      />
                    ) : (
                      <div className="flex items-center gap-2 rounded-md bg-neutral-200 px-3 py-2">
                        <span className="text-sm text-neutral-700">{file.name}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {currentThreadId && (
            <Button
              variant="ghost"
              size="icon"
              className=""
              onClick={() => handleFork(i)}
            >
              <GitForkIcon className="h-4 w-4" style={{ color: "black" }} />
            </Button>
          )}
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
