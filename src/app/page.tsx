"use client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import ChatLayout from "./_components/chat-layout";
import { ChevronDownIcon, SendHorizonalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { sendPromptAction } from "@/server/actions/prompt-actions";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChatPage() {
  const [prompt, setPrompt] = useState("");
  const [textboxHeight, setTextboxHeight] = useState<number | "auto">(24);
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string; type: "error" | "normal" }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const submitPrompt = () => {
    if (prompt.length < 1) return;
    if (prompt.split("\n").every((l) => l.length < 1)) return;
    setLoading(true);
    sendPromptAction({ prompt })
      .then((res) => {
        setLoading(false);
        setPrompt("");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            type: "normal",
            content: res + "",
          },
        ]);
      })
      .catch(() => {
        setLoading(false);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            type: "error",
            content: "متاسفم، در پردازش درخواست شما خطایی رخ داد!",
          },
        ]);
      });
  };
  return (
    <ChatLayout>
      <div className="flex h-screen flex-col px-6 pt-8">
        <div className="mx-auto flex w-full max-w-2xl flex-grow flex-col gap-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex w-full items-center gap-2 rounded-md border bg-neutral-600 p-4 text-neutral-300",
                m.type === "error" && "bg-red-600 font-semibold text-white",
              )}
            >
              <div className="flex-grow">
                {m.content.split("\n").map((l, i) => (
                  <div key={i} className="rtl text-sm leading-relaxed">
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
        <div className="relative mx-auto flex w-full max-w-2xl flex-col items-end rounded-t-lg bg-neutral-600 px-6 py-4 text-white">
          <textarea
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (!e.shiftKey) {
                  e.preventDefault();
                  submitPrompt();
                  return false;
                }
              }
            }}
            onChange={(e) => {
              if (e.target.value.length < prompt.length)
                setTextboxHeight("auto");
              setPrompt(e.target.value);
              setTimeout(() => {
                setTextboxHeight(e.target.scrollHeight);
              }, 0);
            }}
            value={prompt}
            style={{ height: textboxHeight }}
            placeholder="...پیام خود را اینجا بنویسید"
            className="rtl mb-4 w-full resize-none text-right text-base outline-none"
          />
          <Popover>
            <PopoverTrigger className="flex w-max cursor-pointer items-center gap-1 text-neutral-300 transition-colors hover:text-white">
              <ChevronDownIcon className="h-4 w-4" />
              <div className="text-sm font-semibold">دیپ سیک ۳</div>
            </PopoverTrigger>
            <PopoverContent>{textboxHeight}</PopoverContent>
          </Popover>
          <Button
            disabled={prompt.length < 1 || loading}
            onClick={() => submitPrompt()}
            className="absolute bottom-4 left-4 mt-4 rounded-full"
            size={"icon"}
          >
            <SendHorizonalIcon className="-scale-x-100 transform" />
          </Button>
        </div>
      </div>
    </ChatLayout>
  );
}
