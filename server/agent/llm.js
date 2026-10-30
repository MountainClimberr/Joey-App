import OpenAI from "openai";
import "dotenv/config";

// load .env into process.env. 
const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: process.env.LLM_BASE_URL,
});

// complete a chat completion request
export async function complete(messages) {
  const res = await client.chat.completions.create({
    model: process.env.LLM_MODEL,
    messages,
    max_tokens: 1000,
    reasoning_effort: "low",
  })
  console.log("finish:", res.choices[0].finish_reason, "| tokens:", res.usage);
  return res.choices[0].message.content;
}
