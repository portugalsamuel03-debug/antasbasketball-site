
import { GoogleGenAI } from "@google/genai";

export async function askGeminiAboutBasketball(query: string) {
  // Always use a named parameter for the API key and access process.env.API_KEY directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction: "Você é o assistente virtual do blog 'Antas Basketball'. Responda de forma curta, empolgante e com gírias de basquete. O blog existe desde 2017.",
      }
    });
    // Access the .text property directly instead of calling it as a method
    return response.text || "Sem resposta no momento, o garrafão está cheio!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao conectar com a IA. Tente novamente mais tarde.";
  }
}
