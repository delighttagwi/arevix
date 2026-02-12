
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getBoardInsights(boardName: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide 3 unique pro-tips for working with ${boardName} in electronics projects for an engineering student. Keep it concise.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ensure proper power supply and double-check your pin connections.";
  }
}
