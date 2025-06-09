"use client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SUPPORTED_MODELS } from "@/lib/models";
import { sendPromptAction } from "@/server/actions/prompt-actions";
import { useState } from "react";
import { useMainStore } from "../store/mainStore";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, SendHorizonalIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChatBox() {
  const { currentMessages, setCurrentMessages, loading, setLoading } =
    useMainStore();
  const [prompt, setPrompt] = useState("");
  const [textboxHeight, setTextboxHeight] = useState<number | "auto">(24);
  const [selectedModel, setSelectedModel] = useState(SUPPORTED_MODELS[0]!);

  const submitPrompt = () => {
    if (prompt.length < 1) return;
    if (prompt.split("\n").every((l) => l.length < 1)) return;
    if (loading) return;

    const existingMessages = currentMessages;
    const updatedMessages = [
      ...existingMessages,
      {
        role: "user" as const,
        content: prompt,
        type: "normal" as const,
      },
    ];
    setCurrentMessages(updatedMessages);
    setLoading(true);

    sendPromptAction({
      prompt: prompt,
      modelId: selectedModel.id,
      existingMessages: existingMessages, // not including the current
    })
      .then((res) => {
        setLoading(false);
        setPrompt("");
        setTextboxHeight(24);
        setCurrentMessages([
          ...currentMessages,
          {
            role: "assistant",
            type: "normal",
            content: res + "",
          },
        ]);
      })
      .catch(() => {
        setLoading(false);
        setCurrentMessages([
          ...currentMessages,
          {
            role: "assistant",
            type: "error",
            content: "متاسفم، در پردازش درخواست شما خطایی رخ داد!",
          },
        ]);
      });
  };

  return (
    <div className="relative mx-auto flex w-full max-w-2xl rounded-t-lg bg-neutral-600 px-6 py-4 text-white">
      <div className="flex w-full items-center">
        <div className="mr-4 flex-shrink-0">
          <Popover>
            <PopoverTrigger className="flex w-max cursor-pointer items-center gap-1 text-neutral-300 transition-colors hover:text-white">
              <div className="text-sm font-semibold">{selectedModel.name}</div>
              <ChevronDownIcon className="h-4 w-4" />
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2">
              <div className="flex flex-col gap-1">
                {SUPPORTED_MODELS.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model);
                    }}
                    className={cn(
                      "cursor-pointer rounded-md p-2 text-left text-sm transition-colors",
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
        </div>
        <div className="relative flex-grow">
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
            placeholder="Write your message here..."
            className="w-full resize-none text-left text-base outline-none"
          />
          <Button
            disabled={prompt.length < 1 || loading}
            onClick={() => submitPrompt()}
            className="absolute right-0 bottom-0 rounded-full"
            size={"icon"}
          >
            <SendHorizonalIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
