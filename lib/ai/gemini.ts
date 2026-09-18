import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Google Gemini API Client (Strictly Server-Side)
 * Reads key exclusively from process.env.GEMINI_API_KEY
 */
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is not configured. Please add it to your .env.local file."
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

export async function generateGeminiContent(
  prompt: string,
  systemInstruction?: string,
  modelName: string = DEFAULT_MODEL
): Promise<string> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: systemInstruction
      ? { role: "system", parts: [{ text: systemInstruction }] }
      : undefined,
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}
