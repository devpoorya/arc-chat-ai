"use server";
import { OpenAI } from "openai";
export async function sendPromptAction({ prompt }: { prompt: string }) {
  const openai = new OpenAI({
    apiKey: "fw_3Zmy8hwd3hQHCbufFXJHVKjs",
    baseURL: "https://api.fireworks.ai/inference/v1",
  });

  const completion = await openai.chat.completions.create({
    model: "accounts/fireworks/models/deepseek-v3",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1000,
    temperature: 0.7,
  });

  console.log(completion);

  return completion?.choices[0]?.message?.content;
}
