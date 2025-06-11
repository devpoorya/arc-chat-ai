"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogInIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { AnimatePresence, motion, useSpring } from "motion/react";
import { useMainStore } from "../store/mainStore";
import { type threads } from "@/db/schema/content.sql";
import { getThreadMessagesAction } from "@/server/actions/prompt-actions";

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
  } = useMainStore();
  const height = useSpring("96vh", {
    bounce: 0,
  });
  const windowHeight = useMemo(
    () => (typeof window !== "undefined" ? window.innerHeight - 32 : 100),
    [],
  );
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
            className="flex-grow pb-4"
          >
            {threadsList?.map((t) => (
              <div
                key={t.id}
                onClick={() => {
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
                            "متاسفم، در پردازش درخواست شما خطایی رخ داد!",
                        },
                      ]);
                    });
                }}
                className="glass mx-2 flex cursor-pointer items-center gap-4 px-4 py-2 text-sm font-semibold"
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
        </div>
      ) : (
        <Button asChild className="mx-4 w-full" variant={"default"}>
          <Link href={"/auth/login"}>
            <LogInIcon />
            Login
          </Link>
        </Button>
      )}
    </motion.div>
  );
}
