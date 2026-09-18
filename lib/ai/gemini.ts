import { GoogleGenerativeAI } from "@google/generative-ai";

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is not configured. Please add it to your .env.local file."
    );
  }
  return apiKey;
}

const PRIMARY_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const FALLBACK_MODELS = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3.6-flash"];

export interface GenerateOptions {
  enableSearchGrounding?: boolean;
  systemInstruction?: string;
}

export interface GenerateResult {
  text: string;
  isWebSearch: boolean;
  sources: Array<{ title: string; url: string }>;
}

/**
 * Robust content generation using Google Gemini with automatic model resilience
 * and optional live Google Search grounding.
 */
export async function generateGeminiContent(
  prompt: string,
  systemInstruction?: string,
  modelName: string = PRIMARY_MODEL
): Promise<string> {
  const apiKey = getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);

  const modelsToTry = [modelName, PRIMARY_MODEL, ...FALLBACK_MODELS].filter(
    (m, i, arr) => arr.indexOf(m) === i
  );

  let lastError: any = null;

  for (const m of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: m,
        systemInstruction: systemInstruction
          ? { role: "system", parts: [{ text: systemInstruction }] }
          : undefined,
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (err: any) {
      lastError = err;
      // If 404 (deprecated), 503 (demand spike), 429 (quota exhausted), or 500, try next model
      const msg = err.message || "";
      if (
        msg.includes("404") ||
        msg.includes("503") ||
        msg.includes("429") ||
        msg.includes("500") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("UNAVAILABLE")
      ) {
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

/**
 * Dedicated Copilot generation with official Google Search grounding tool support
 * and source citation extraction.
 */
export async function generateCopilotWithSearch(
  prompt: string,
  systemInstruction: string,
  enableSearch: boolean = true
): Promise<GenerateResult> {
  const apiKey = getApiKey();
  const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS];

  // If search is requested, try REST API with Google Search grounding tool
  if (enableSearch) {
    for (const m of modelsToTry) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              systemInstruction: { parts: [{ text: systemInstruction }] },
              tools: [{ googleSearch: {} }],
            }),
          }
        );

        const data = await res.json();
        if (data.candidates && data.candidates[0]) {
          const candidate = data.candidates[0];
          const text = candidate.content?.parts?.[0]?.text || "";

          // Extract sources from groundingMetadata
          const sources: Array<{ title: string; url: string }> = [];
          const chunks = candidate.groundingMetadata?.groundingChunks;
          if (Array.isArray(chunks)) {
            chunks.forEach((c: any) => {
              if (c.web?.uri) {
                sources.push({
                  title: c.web.title || new URL(c.web.uri).hostname,
                  url: c.web.uri,
                });
              }
            });
          }

          const hasWebGrounding =
            sources.length > 0 || !!candidate.groundingMetadata?.webSearchQueries?.length;

          return {
            text,
            isWebSearch: hasWebGrounding,
            sources,
          };
        }
      } catch (err) {
        // Fall back to standard generation if search tool hits rate limits
      }
    }
  }

  // Standard generation without search tool
  const text = await generateGeminiContent(prompt, systemInstruction);
  return {
    text,
    isWebSearch: false,
    sources: [],
  };
}
