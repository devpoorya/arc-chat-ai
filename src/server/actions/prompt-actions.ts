"use server";
import { db } from "@/db";
import { messages, threads } from "@/db/schema/content.sql";
import { env } from "@/env";
import { validateRequest } from "@/lib/server-utils";
import { asc, eq } from "drizzle-orm";
import { OpenAI } from "openai";
import { nanoid } from "nanoid";
import { type Message } from "@/app/store/mainStore";

export async function sendPromptAction({
  prompt,
  modelId,
  existingMessages,
  threadId,
  responseType,
  files,
  openRouterApiKey,
}: {
  prompt: string;
  modelId: string;
  existingMessages: Message[];
  threadId: number | null;
  responseType: "normal" | "creative" | "factual";
  files?: File[];
  openRouterApiKey: string | null;
}) {
  const { session } = await validateRequest();
  if (!session) throw new Error("Unauthorized");
  
  if (!openRouterApiKey) {
    throw new Error("OpenRouter API key is required. Please set it in the settings.");
  }

  const openai = new OpenAI({
    apiKey: openRouterApiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });

  const formattedMessages = existingMessages
    .filter((msg) => msg.type !== "error")
    .map((msg) => ({
      role: msg.role,
      content: msg.content,
    })); // removing the type field

  // Handle file uploads if present
  let imageContent = null;
  let messageContent: string | { type: string; text?: string; image_url?: { url: string } }[] = prompt;

  if (files && files.length > 0) {
    const file = files[0];
    if (file && file.type.startsWith('image/')) {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      imageContent = `data:${file.type};base64,${base64}`;
      
      // Format message with image for OpenAI API
      messageContent = [
        {
          type: "text",
          text: prompt || "Please analyze this image"
        },
        {
          type: "image_url",
          image_url: {
            url: imageContent
          }
        }
      ];
    }
  }

  // Add the user's message with image content if present
  formattedMessages.push({ 
    role: "user", 
    content: messageContent as any // Type assertion needed due to OpenAI's type definitions
  });

  // Adjust temperature based on response type
  const temperature = {
    normal: 0.5,
    creative: 1,
    factual: 0,
  }[responseType];

  const completion = await openai.chat.completions.create({
    model: modelId,
    messages: formattedMessages,
    temperature,
  });

  const response = completion.choices[0]?.message?.content;

  if (!response) {
    throw new Error("No response from the model");
  }

  // Create or update thread
  let currentThreadId = threadId;
  if (!currentThreadId) {
    const [newThread] = await db
      .insert(threads)
      .values({
        threadOwnerId: session.userId,
        title: prompt.slice(0, 50) + (prompt.length > 50 ? "..." : ""),
      })
      .returning();
    
    if (!newThread) {
      throw new Error("Failed to create new thread");
    }
    
    currentThreadId = newThread.id;
  }

  // Save messages
  await db.insert(messages).values([
    {
      threadId: currentThreadId,
      textContent: prompt,
      senderRole: "user",
    },
    {
      threadId: currentThreadId,
      textContent: response,
      senderRole: "system",
    },
  ]);

  return {
    response,
    newThread: !threadId ? {
      id: currentThreadId,
      title: prompt.slice(0, 50) + (prompt.length > 50 ? "..." : ""),
      threadOwnerId: session.userId,
      shareId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    } : null,
  };
}

export async function getThreadMessagesAction({
  threadId,
}: {
  threadId: number;
}) {
  const { session } = await validateRequest();
  if (!session) throw new Error("Unauthorized");

  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, threadId),
  });

  if (!thread || thread.threadOwnerId !== session.userId) {
    throw new Error("Thread not found");
  }

  const threadMessages = await db.query.messages.findMany({
    where: eq(messages.threadId, threadId),
    orderBy: (messages, { asc }) => [asc(messages.createdAt)],
  });

  return threadMessages;
}

export async function forkThreadAction({
  threadId,
  messageIndex,
}: {
  threadId: number;
  messageIndex: number;
}) {
  const { session } = await validateRequest();
  if (!session) throw new Error("Unauthorized");

  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, threadId),
  });

  if (!thread || thread.threadOwnerId !== session.userId) {
    throw new Error("Thread not found");
  }

  const threadMessages = await db.query.messages.findMany({
    where: eq(messages.threadId, threadId),
    orderBy: (messages, { asc }) => [asc(messages.createdAt)],
  });

  // Create new thread
  const [newThread] = await db
    .insert(threads)
    .values({
      threadOwnerId: session.userId,
      title: thread.title + " (Fork)",
    })
    .returning();

  if (!newThread) {
    throw new Error("Failed to create new thread");
  }

  // Copy messages up to the fork point
  const messagesToCopy = threadMessages.slice(0, messageIndex + 1);
  await db.insert(messages).values(
    messagesToCopy.map((msg) => ({
      threadId: newThread.id,
      textContent: msg.textContent,
      senderRole: msg.senderRole,
    }))
  );

  return newThread;
}
