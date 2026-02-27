import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const chatModel = "gemini-3-flash-preview";

export async function getChatResponse(message: string, history: { role: "user" | "model"; parts: { text: string }[] }[]) {
  // Fetch knowledge base
  let knowledgeContext = "";
  try {
    const response = await fetch('/api/knowledge');
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

  const result = await chat.sendMessage({ message });
  return result;
}
