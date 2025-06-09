"use client";
import { cn } from "@/lib/utils";
import { useMainStore } from "../store/mainStore";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChatMessages() {
  const { currentMessages, loading } = useMainStore();
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-grow flex-col gap-4">
      {currentMessages.map((m, i) => (
        <div
          key={i}
          className={cn(
            "flex w-full items-center gap-2 rounded-md border bg-neutral-600 p-4 text-neutral-300",
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
    </div>
  );
}
