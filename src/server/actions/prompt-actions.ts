"use server";
import { db } from "@/db";
import { messages, threads } from "@/db/schema/content.sql";
import { env } from "@/env";
import { validateRequest } from "@/lib/server-utils";
import { asc, eq } from "drizzle-orm";
import { OpenAI } from "openai";

type Message = {
  role: "user" | "system";
  content: string;
  type: "error" | "normal";
};

export async function sendPromptAction({
  prompt,
  modelId,
  existingMessages,
  threadId,
  responseType,
  files,
}: {
  prompt: string;
  modelId: string;
  existingMessages: Message[];
  threadId: number | null;
  responseType: "normal" | "creative" | "factual";
  files?: File[];
}) {
  const { session } = await validateRequest();
  if (!session) throw new Error("Unauthorized");
  const openai = new OpenAI({
    apiKey: env.OPENROUTER_API_KEY,
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

  const response = completion?.choices[0]?.message?.content;

  let decidedThreadId: number | null = threadId;
  let newThread: typeof threads.$inferSelect | null = null;
  if (!decidedThreadId) {
    const threadTitleCompletion = await openai.chat.completions.create({
      model: "google/gemini-2.0-flash-001",
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: `Generate a title for the following message and output only the title without any other text: "${prompt}"`,
        },
      ],
    });
    const [threadInsert] = await db
      .insert(threads)
      .values({
        title:
          threadTitleCompletion.choices.at(0)?.message.content ??
          "Untitled Chat",
        threadOwnerId: session.userId,
      })
      .returning();
    newThread = threadInsert ?? null;
    decidedThreadId = threadInsert?.id ?? null;
  }

  if (!decidedThreadId) throw new Error("Failed to create thread");

  await db
    .update(threads)
    .set({
      updatedAt: new Date(),
    })
    .where(eq(threads.id, decidedThreadId));

  await db.insert(messages).values({
    senderRole: "user",
    threadId: decidedThreadId,
    textContent: prompt,
    imageContent,
  });
  await db.insert(messages).values({
    senderRole: "system",
    threadId: decidedThreadId,
    textContent: response,
    imageContent: null,
  });

  return { response, newThread };
}

export async function getThreadMessagesAction({
  threadId,
}: {
  threadId: number;
}) {
  const { session } = await validateRequest();
  if (!session) throw new Error("Unauthorized");

  const messageList = await db.query.messages.findMany({
    where: eq(messages.threadId, threadId),
    orderBy: asc(messages.createdAt),
  });
  return messageList;
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

  // Get all messages up to the specified index
  const threadMessages = await db.query.messages.findMany({
    where: eq(messages.threadId, threadId),
    orderBy: asc(messages.createdAt),
    limit: messageIndex + 1,
  });

  if (!threadMessages.length) throw new Error("No messages found");

  // Create new thread with the same title but with "(Forked)" suffix
  const originalThread = await db.query.threads.findFirst({
    where: eq(threads.id, threadId),
  });

  const [newThread] = await db
    .insert(threads)
    .values({
      title: `${originalThread?.title ?? "Untitled Chat"} (Forked)`,
      threadOwnerId: session.userId,
    })
    .returning();

  if (!newThread) throw new Error("Failed to create new thread");

  // Copy messages to new thread
  await db.insert(messages).values(
    threadMessages.map((msg: typeof messages.$inferSelect) => ({
      senderRole: msg.senderRole,
      threadId: newThread.id,
      textContent: msg.textContent,
      imageContent: msg.imageContent,
    }))
  );

  return newThread;
}
