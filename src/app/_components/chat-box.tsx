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

const RESPONSE_TYPES = [
  { id: "normal", label: "Normal" },
  { id: "creative", label: "Creative" },
  { id: "factual", label: "Factual" },
] as const;

export default function ChatBox() {
  const {
    currentMessages,
    setCurrentMessages,
    loading,
    setLoading,
    currentThreadId,
    setThreadsList,
    threadsList,
    setCurrentThreadId,
  } = useMainStore();
  const [prompt, setPrompt] = useState("");
  const [textboxHeight, setTextboxHeight] = useState<number | "auto">(24);
  const [selectedModel, setSelectedModel] = useState(SUPPORTED_MODELS[0]!);
  const [responseType, setResponseType] =
    useState<(typeof RESPONSE_TYPES)[number]["id"]>("normal");

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
      threadId: currentThreadId,
      responseType: responseType,
    })
      .then(({ response, newThread }) => {
        if (newThread) {
          setThreadsList([newThread, ...threadsList]);
          setCurrentThreadId(newThread.id);
        } else {
          setThreadsList(
            [...threadsList].sort((a, b) =>
              a.id === currentThreadId ? -1 : b.id === currentThreadId ? 1 : 0,
            ),
          );
        }
        setLoading(false);
        setPrompt("");
        setTextboxHeight(24);
        setCurrentMessages([
          ...updatedMessages,
          {
            role: "system",
            type: "normal",
            content: response + "",
          },
        ]);
      })
      .catch(() => {
        setLoading(false);
        setCurrentMessages([
          ...currentMessages,
          {
            role: "system",
            type: "error",
            content:
              "An error occured while processing your request please try again!",
          },
        ]);
      });
  };

  return (
    <div className="ms-auto w-[calc(100%-336px)]">
      <div className="glass z-50 mx-auto w-[calc(100%-32px)] p-4">
        <div className="flex w-full flex-col gap-2">
          <div className="glass mb-4 flex w-full max-w-md items-center justify-center gap-1 rounded-lg p-1">
            {RESPONSE_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setResponseType(type.id)}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  responseType === type.id
                    ? "glass text-neutral-800"
                    : "text-white hover:text-white",
                )}
                style={{ color: responseType === type.id ? "black" : "grey", fontWeight: responseType === type.id ? "bold" : "normal" }}
              >
                {type.label}
              </button>
            ))}
          </div>
          <div className="flex w-full items-center">
            <div className="mr-4 flex-shrink-0">
              <Popover>
                <PopoverTrigger className="flex w-max cursor-pointer items-center gap-1 text-neutral-300 transition-colors hover:text-white">
                  <div className="text-sm font-semibold text-white">
                    {selectedModel.name}
                  </div>
                  <ChevronDownIcon className="h-4 w-4" />
                </PopoverTrigger>
                <PopoverContent className="glass bg-primary/10! w-48 p-2 backdrop-brightness-50">
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
      </div>
    </div>
  );
}
