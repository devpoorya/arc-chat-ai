"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogInIcon, LogOutIcon, PlusIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { AnimatePresence, motion, useSpring } from "motion/react";
import { useMainStore } from "../store/mainStore";
import { type threads } from "@/db/schema/content.sql";
import { getThreadMessagesAction } from "@/server/actions/prompt-actions";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ChatSidebar({
  user,
  threadsList,
}: {
  user?: { image?: string | null; name: string; email: string };
  threadsList?: (typeof threads.$inferSelect)[];
}) {
  const {
    sidebarExpanded,
    setSidebarExpanded,
    setCurrentThreadId,
    setCurrentMessages,
    setLoading,
    setThreadsList,
    currentThreadId,
    threadsList: threadsInStore,
  } = useMainStore();
  const height = useSpring("96vh", {
    bounce: 0,
  });
  const router = useRouter();
  const windowHeight = useMemo(
    () => (typeof window !== "undefined" ? window.innerHeight - 32 : 100),
    [],
  );
  useEffect(() => {
    if (threadsList) setThreadsList(threadsList);
  }, [threadsList, setThreadsList]);
  return (
    <motion.div
      animate={{ height: sidebarExpanded ? windowHeight + "px" : "100px" }}
      transition={{
        type: "spring",
        bounce: 0.5,
      }}
      className={cn(
        "glass absolute bottom-[2vh] left-4 flex w-72 flex-col overflow-hidden py-2",
      )}
    >
      <h1
        className="text-foreground mb-4 flex items-center justify-between px-4 text-xl font-bold"
        onClick={() => {
          if (sidebarExpanded) {
            height.set("auto");
          } else {
            height.set("96vh");
          }
          setSidebarExpanded(!sidebarExpanded);
        }}
      >
        Arc Chat
        <span className="cursor-pointer text-sm font-light hover:underline">
          {sidebarExpanded ? "Shrink" : "Expand"}
        </span>
      </h1>
      <AnimatePresence>
        {sidebarExpanded && (
          <motion.div
            key="modal"
            exit={{ opacity: 0 }}
            className="flex flex-grow flex-col gap-2 overflow-y-scroll pb-4"
          >
            <button
              className="hover:bg-primary mx-2 mt-2 mb-2 flex cursor-pointer items-center justify-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-all"
              onClick={() => {
                setCurrentThreadId(null);
                setCurrentMessages([]);
              }}
            >
              <PlusIcon className="size-4" />
              New Chat
            </button>
            {threadsInStore?.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  setCurrentMessages([]);
                  setCurrentThreadId(t.id);
                  setLoading(true);
                  getThreadMessagesAction({ threadId: t.id })
                    .then((res) => {
                      setCurrentMessages(
                        res.map((r) => ({
                          role: r.senderRole,
                          content: r.textContent ?? "",
                          type: "normal",
                        })),
                      );
                      setLoading(false);
                    })
                    .catch(() => {
                      setLoading(false);
                      setCurrentMessages([
                        {
                          role: "system",
                          type: "error",
                          content:
                            "An error occured while processing your request please try again!",
                        },
                      ]);
                    });
                }}
                className={cn(
                  currentThreadId === t.id && "bg-primary/10!",
                  "glass mx-2 flex cursor-pointer items-center gap-4 rounded-lg! px-4 py-2 text-sm font-semibold",
                )}
              >
                {t.title}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      {user ? (
        <div className="flex items-center gap-4 px-4">
          <div className="relative h-9 w-9 overflow-hidden rounded-full">
            <Image src={user.image!} alt="" fill className="object-cover" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{user.name}</div>
            <div className="text-xs font-light text-white">{user.email}</div>
          </div>
          <div
            className="ml-auto cursor-pointer"
            onClick={() => {
              authClient
                .signOut({})
                .then(() => {
                  setCurrentMessages([]);
                  setCurrentThreadId(null);
                  router.refresh();
                })
                .catch(() => {
                  toast("Failed to log you out");
                });
            }}
          >
            <LogOutIcon className="size-4" />
          </div>
        </div>
      ) : (
        <Button asChild className="mx-auto w-64" variant={"default"}>
          <Link href={"/auth/login"}>
            <LogInIcon />
            Login
          </Link>
        </Button>
      )}
    </motion.div>
  );
}
