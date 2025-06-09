"use server";
import { OpenAI } from "openai";
export async function sendPromptAction({ prompt, modelId }: { prompt: string, modelId: string }) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
  });

  const completion = await openai.chat.completions.create({
    model: modelId,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  console.log(completion);

  return completion?.choices[0]?.message?.content;
}
