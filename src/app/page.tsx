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
  const ALL_MODELS = [
    { id: "openai/gpt-4o", name: "GPT-4o" },
    { id: "openai/gpt-4.1", name: "GPT-4.1" },
    { id: "openai/gpt-4.5-preview", name: "GPT-4.5" },
    { id: "openai/o4-mini-high", name: "o4-mini-high" },
    { id: "meta-llama/llama-4-scout", name: "Llama 4 Scout" },
    { id: "deepseek/deepseek-chat-v3-0324", name: "DeepSeek v3" },
    { id: "deepseek/deepseek-r1-0528", name: "DeepSeek R1" },
    { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash" },
    { id: "google/gemini-2.5-pro-preview-05-06", name: "Gemini 2.5 Pro Preview 05-06" },
    { id: "qwen/qwen3-235b-a22b", name: "Qwen3 235B A22B" },
  ];

  const [prompt, setPrompt] = useState("");
  const [textboxHeight, setTextboxHeight] = useState<number | "auto">(24);
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string; type: "error" | "normal" }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(ALL_MODELS[0]!);

  

  const submitPrompt = () => {
    if (prompt.length < 1) return;
    if (prompt.split("\n").every((l) => l.length < 1)) return;
    
    // Add user message to the messages list
    const userMessage = {
      role: "user" as const,
      content: prompt,
      type: "normal" as const,
    };
    
    const existingMessages = messages;
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);
    
    sendPromptAction({ 
      prompt: prompt, 
      modelId: selectedModel.id,
      existingMessages: existingMessages // not including the current
    })
      .then((res) => {
        setLoading(false);
        setPrompt("");
        setTextboxHeight(24);
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
              <div className="text-sm font-semibold">{selectedModel.name}</div>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2">
              <div className="flex flex-col gap-1">
                {ALL_MODELS.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model);
                    }}
                    className={cn(
                      "cursor-pointer rounded-md p-2 text-sm transition-colors rtl text-right",
                      selectedModel.id === model.id
                        ? "bg-neutral-700 text-white"
                        : "text-black-300 hover:bg-neutral-700 hover:text-white",
                    )}
                  >
                    {model.name}
                  </div>
                ))}
              </div>
            </PopoverContent>
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
