
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Google Gemini API Key is missing in environment variables.");
  return new GoogleGenAI({ apiKey });
};

export const generateRAGResponse = async (
  query: string,
  context: string,
  history: { role: 'user' | 'assistant', content: string }[]
): Promise<string> => {
  const ai = getAiClient();
  
  const systemInstruction = `
    You are an expert Energy Domain AI Assistant. 
    Your primary goal is to answer questions based strictly on the provided technical documentation, reports, or research papers.
    
    CONTEXT RULES:
    1. Use only the provided context to answer.
    2. If the answer is not in the context, state that clearly. Do not hallucinate.
    3. Use technical energy sector terminology correctly (e.g., PV efficiency, grid balancing, decarbonization, LCOE).
    4. Provide structured answers (bullet points, clear headings) when appropriate.
    5. Always reference the relevant parts of the document in your explanation.

    CURRENT CONTEXT FROM UPLOADED DOCUMENTS:
    ${context || "No context provided. Inform the user you need documents to answer technical questions."}
  `;

  const contents = [
    ...history.map(h => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }]
    })),
    { role: 'user', parts: [{ text: query }] }
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents as any,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.15, // Extremely low temperature for strict factual adherence
      },
    });

    if (!response.text) {
      throw new Error("Gemini returned an empty response. This may be due to safety filters or context length.");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("API_KEY_INVALID")) {
      throw new Error("Invalid Gemini API Key. Please check your project settings.");
    }
    if (error.message?.includes("429")) {
      throw new Error("Rate limit exceeded. Please wait a moment before asking another question.");
    }
    throw new Error(`Gemini API Error: ${error.message || "Failed to generate response"}`);
  }
};
