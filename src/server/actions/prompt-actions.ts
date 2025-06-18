"use server";
import { db } from "@/db";
import { messages, threads } from "@/db/schema/content.sql";
import { env } from "@/env";
import { validateRequest } from "@/lib/server-utils";
import { asc, eq } from "drizzle-orm";
import { OpenAI } from "openai";
import { nanoid } from "nanoid";
import { type Message } from "@/app/store/mainStore";
import * as fs from 'fs';
import * as path from 'path';

// Logging utility
function logToFile(message: string) {
  const logDir = path.join(process.cwd(), 'logs');
  const logFile = path.join(logDir, 'debug.log');
  
  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  fs.appendFileSync(logFile, logMessage);
}

// Function to determine if web search is needed
async function shouldSearchWeb(prompt: string, openai: OpenAI): Promise<boolean> {
  logToFile(`Checking if web search is needed for prompt: ${prompt}`);
  
  const completion = await openai.chat.completions.create({
    model: "openai/gpt-4o", // Using a fast model for this check
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that determines if a user's question requires real-time web search to provide accurate information. Respond with only 'true' or 'false'."
      },
      {
        role: "user",
        content: `Does this question require real-time web search to provide accurate information? Question: "${prompt}"`
      }
    ],
    temperature: 0,
  });

  const response = completion.choices[0]?.message?.content?.toLowerCase().trim();
  logToFile(`Search determination response: ${response}`);
  logToFile(`Will perform search: ${response?.includes("true") ?? false}`);
  return response?.includes("true") ?? false;
}

// Function to perform web search
async function performWebSearch(query: string): Promise<string> {
  logToFile(`Performing web search for query: ${query}`);
  logToFile(`Using SERPER_API_KEY: ${process.env.SERPER_API_KEY ? "Present" : "Missing"}`);
  
  // Using Serper.dev API for web search
  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": process.env.SERPER_API_KEY || "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: query,
      num: 3, // Get top 3 results
    }),
  });

  logToFile(`Search API response status: ${response.status}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    logToFile(`Search API error: ${errorText}`);
    throw new Error(`Web search failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  logToFile(`Search API response data: ${JSON.stringify(data, null, 2)}`);
  
  const searchResults = data.organic || [];
  logToFile(`Number of search results: ${searchResults.length}`);
  
  // Format search results
  const formattedResults = searchResults
    .map((result: any) => `${result.title}\n${result.snippet}\nSource: ${result.link}`)
    .join("\n\n");

  logToFile(`Formatted search results: ${formattedResults}`);
  return formattedResults;
}

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

  logToFile(`Starting sendPromptAction with prompt: ${prompt}`);

  // Check if web search is needed
  let needsSearch = false;
  let searchResults = "";
  try {
    needsSearch = await shouldSearchWeb(prompt, openai);
    logToFile(`Needs search: ${needsSearch}`);
    
    if (needsSearch) {
      try {
        searchResults = await performWebSearch(prompt);
        logToFile("Search completed successfully");
      } catch (error) {
        logToFile(`Web search failed: ${error}`);
        // Continue without search results if search fails
      }
    }
  } catch (error) {
    logToFile(`Error in search determination: ${error}`);
  }

  const formattedMessages = existingMessages
    .filter((msg) => msg.type !== "error")
    .map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

  // Add search results to the system message if available
  if (searchResults) {
    logToFile("Adding search results to context");
    formattedMessages.unshift({
      role: "system",
      content: `Here are some relevant search results that may help answer the user's question:\n\n${searchResults}\n\nPlease use this information to provide a more accurate response. Please provide the sources (links) of each info you use, in markdown format.`
    });
  }

  logToFile(`Final formatted messages: ${JSON.stringify(formattedMessages, null, 2)}`);

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
