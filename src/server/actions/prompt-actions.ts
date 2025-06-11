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
}: {
  prompt: string;
  modelId: string;
  existingMessages: Message[];
  threadId: number | null;
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

  formattedMessages.push({ role: "user", content: prompt });

  const completion = await openai.chat.completions.create({
    model: modelId,
    messages: formattedMessages,
    temperature: 0.7,
  });

  const response = completion?.choices[0]?.message?.content;

  let decidedThreadId: number | null = threadId;
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
    decidedThreadId = threadInsert?.id ?? null;
  }

  if (!decidedThreadId) throw new Error("Failed to create thread");

  await db.insert(messages).values({
    senderRole: "user",
    threadId: decidedThreadId,
    textContent: prompt,
    imageContent: null, // Null for now until we add image support
  });
  await db.insert(messages).values({
    senderRole: "system",
    threadId: decidedThreadId,
    textContent: response,
    imageContent: null, // Null for now until we add image support
  });

  return response;
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
