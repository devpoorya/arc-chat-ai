"use server";
import { OpenAI } from "openai";

type Message = {
  role: "user" | "assistant";
  content: string;
  type: "error" | "normal";
};

export async function sendPromptAction({ prompt, modelId, existingMessages }: { prompt: string; modelId: string; existingMessages: Message[]; }) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
  });

  const formattedMessages = existingMessages
    .filter(msg => msg.type !== "error")
    .map(msg => ({
      role: msg.role,
      content: msg.content
    })); // removing the type field
  
  formattedMessages.push({ role: "user", content: prompt });

  const completion = await openai.chat.completions.create({
    model: modelId,
    messages: formattedMessages,
    temperature: 0.7,
  });

  console.log(completion);

  return completion?.choices[0]?.message?.content;
}
