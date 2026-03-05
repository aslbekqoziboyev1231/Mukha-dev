import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const chatModel = "gemini-3-flash-preview";
export const imageModel = "gemini-2.5-flash-image";
export const ttsModel = "gemini-2.5-flash-preview-tts";

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.message?.includes('overload') || error.message?.includes('503') || error.message?.includes('500') || error.message?.includes('maintenance'))) {
      console.warn(`API call failed, retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 1.5); // Exponential backoff
    }
    throw error;
  }
}

export async function generateImage(prompt: string) {
  const response = await withRetry(() => ai.models.generateContent({
    model: imageModel,
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: "1K"
      }
    }
  }));

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}

export async function generateSpeech(text: string) {
  const response = await withRetry(() => ai.models.generateContent({
    model: ttsModel,
    contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  }));

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    return `data:audio/wav;base64,${base64Audio}`;
  }
  return null;
}

export async function getChatResponse(message: string, history: { role: "user" | "model"; parts: { text: string }[] }[]) {
  // Fetch knowledge base with retry
  let knowledgeContext = "";
  try {
    const response = await withRetry(() => fetch('/api/knowledge'), 2, 1000);
    if (response.ok) {
      const knowledge = await response.json();
      if (knowledge && knowledge.length > 0) {
        knowledgeContext = "\n\nKnowledge Base:\n" + knowledge.map((k: any) => `- ${k.title}: ${k.content}`).join("\n");
      }
    }
  } catch (err) {
    console.error('Failed to fetch knowledge base:', err);
  }

  const chat = ai.chats.create({
    model: chatModel,
    config: {
      systemInstruction: `You are Mukha, a helpful and sophisticated AI assistant. Your tone is professional yet approachable. You provide concise and accurate information.${knowledgeContext}`,
    },
    history: history,
  });

  const result = await withRetry(() => chat.sendMessage({ message }));
  return result;
}
