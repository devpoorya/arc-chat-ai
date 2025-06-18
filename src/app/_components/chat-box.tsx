"use client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SUPPORTED_MODELS } from "@/lib/models";
import { sendPromptAction } from "@/server/actions/prompt-actions";
import { useState, useRef } from "react";
import { useMainStore } from "../store/mainStore";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, SendHorizonalIcon, PaperclipIcon } from "lucide-react";
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
    openRouterApiKey,
  } = useMainStore();
  const [prompt, setPrompt] = useState("");
  const [textboxHeight, setTextboxHeight] = useState<number | "auto">(24);
  const [selectedModel, setSelectedModel] = useState(SUPPORTED_MODELS[0]!);
  const [responseType, setResponseType] =
    useState<(typeof RESPONSE_TYPES)[number]["id"]>("normal");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const submitPrompt = () => {
    if (prompt.length < 1 && selectedFiles.length === 0) return;
    if (prompt.split("\n").every((l) => l.length < 1) && selectedFiles.length === 0) return;
    if (loading) return;

    const existingMessages = currentMessages;
    const updatedMessages = [
      ...existingMessages,
      {
        role: "user" as const,
        content: prompt,
        type: "normal" as const,
        files: selectedFiles,
      },
    ];
    setCurrentMessages(updatedMessages);
    setLoading(true);

    // Create FormData to send files
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('modelId', selectedModel.id);
    formData.append('threadId', currentThreadId?.toString() || '');
    formData.append('responseType', responseType);
    selectedFiles.forEach((file, index) => {
      formData.append(`file${index}`, file);
    });

    sendPromptAction({
      prompt: prompt,
      modelId: selectedModel.id,
      existingMessages: existingMessages,
      threadId: currentThreadId,
      responseType: responseType,
      files: selectedFiles,
      openRouterApiKey,
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
        setSelectedFiles([]);
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
              "An error occured while processing your request please try again! Maybe you need to set an updated OpenRouter API key in the settings (button in the top of the screen).",
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
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[200px] justify-between">
                    <div className="text-sm font-semibold text-white">
                      {selectedModel.name}
                    </div>
                    <ChevronDownIcon className="h-4 w-4" />
                  </Button>
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
              {selectedFiles.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 rounded-md bg-neutral-700 px-2 py-1 text-sm text-white"
                    >
                      <span>{file.name}</span>
                      <button
                        onClick={() => removeFile(index)}
                        className="ml-1 text-neutral-300 hover:text-white"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
                style={{ height: textboxHeight, color: 'black' }}
                placeholder="Write your message here..."
                className="w-full resize-none text-left text-base outline-none"
              />
              <div className="absolute right-0 bottom-0 flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,application/pdf"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <PaperclipIcon className="h-4 w-4" style={{ color: "black" }} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={submitPrompt}
                  disabled={loading}
                >
                  <SendHorizonalIcon className="h-4 w-4" style={{ color: "black" }} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
