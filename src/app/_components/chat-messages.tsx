"use client";
import { cn } from "@/lib/utils";
import { useMainStore } from "../store/mainStore";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "motion/react";
import { GitForkIcon } from "lucide-react";
import { forkThreadAction } from "@/server/actions/prompt-actions";
import { Button } from "@/components/ui/button";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from "react";
import { db } from "@/db";
import { threads } from "@/db/schema/content.sql";
import { eq } from "drizzle-orm";

export default function ChatMessages({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { currentMessages, loading, sidebarExpanded, currentThreadId, setThreadsList, threadsList, setCurrentThreadId } = useMainStore();
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

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

  const handleShare = async () => {
    if (!currentThreadId) return;
    setSharing(true);
    try {
      // Fetch the thread to check for existing shareId
      const thread = threadsList.find(t => t.id === currentThreadId);
      let shareId = thread?.shareId;
      if (!shareId) {
        // Generate a random 8-character string
        shareId = Math.random().toString(36).substring(2, 10);
        // Update the thread in the database (call an API route you will create)
        await fetch(`/api/share-thread`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId: currentThreadId, shareId }),
        });
        // Update local state
        setThreadsList(
          threadsList.map(t => t.id === currentThreadId ? { ...t, shareId: shareId ?? null } : t)
        );
      }
      setShareLink(`${window.location.origin}/share/${shareId}`);
    } catch (e) {
      alert("Failed to generate share link");
    }
    setSharing(false);
  };

  const renderMessageContent = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before the code block
      if (match.index > lastIndex) {
        parts.push(
          <div key={`text-${lastIndex}`} className="text-sm leading-relaxed" style={{ color: "black" }}>
            {content.slice(lastIndex, match.index)}
          </div>
        );
      }

      // Add the code block with syntax highlighting
      const language = match[1] || 'text';
      const code = match[2]?.trim() || '';
      parts.push(
        <div key={`code-${match.index}`} className="my-2">
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add any remaining text
    if (lastIndex < content.length) {
      parts.push(
        <div key={`text-${lastIndex}`} className="text-sm leading-relaxed" style={{ color: "black" }}>
          {content.slice(lastIndex)}
        </div>
      );
    }

    return parts;
  };

  return (
    <motion.div
      animate={{
        width: sidebarExpanded ? "calc(100% - 336px)" : "calc(100% - 32px)",
      }}
      className="z-0 mt-4 mr-4 ml-auto flex h-[calc(100vh-148px-2vh)] w-full flex-grow flex-col gap-4 overflow-y-scroll"
    >
      {isLoggedIn && currentThreadId && (
        <div className="flex items-center gap-2 mb-2">
          <Button onClick={handleShare} disabled={sharing} variant="outline" size="sm">
            {sharing ? "Generating..." : "Share Chat"}
          </Button>
          {shareLink && (
            <input
              className="ml-2 px-2 py-1 border rounded text-black text-xs w-64"
              value={shareLink}
              readOnly
              onClick={e => { (e.target as HTMLInputElement).select(); document.execCommand('copy'); }}
              title="Click to copy"
            />
          )}
        </div>
      )}
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
            {renderMessageContent(m.content)}
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
