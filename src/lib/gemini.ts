import { GoogleGenAI } from "@google/genai";

// Initialize default AI with the key from environment
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function enhanceSmile(base64Data: string, mimeType: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: "You are a professional cosmetic dentist and AI image editor. Enhance the smile in this photo. Make the teeth perfectly straight, naturally white, and professionally aligned. The smile should be radiant yet realistic. DO NOT change the person's facial features, skin tone, or background. Only focus on the dental enhancement. Output the modified image.",
          },
        ],
      },
    });

    if (!response.candidates?.[0]?.content?.parts) {
      throw new Error("Failed to generate response");
    }

    const imagePart = response.candidates[0].content.parts.find(p => p.inlineData);
    if (!imagePart || !imagePart.inlineData) {
      throw new Error("No image found in AI response. The model might have returned text instead.");
    }

    return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message?.includes("Rate exceeded") || error.message?.includes("Quota exceeded")) {
      throw new Error("Batas penggunaan AI terlampaui. Silakan coba lagi dalam beberapa menit.");
    }
    throw error;
  }
}

export async function analyzeSmileFeedback(base64Data: string, mimeType: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: "As a dental AI, provide a very brief (2-3 sentences), encouraging analysis of the current smile in this photo and what the AI will improve (e.g., alignment, brightness, symmetry).",
          },
        ],
      },
    });

    return response.text || "Analyzing your smile...";
  } catch (error: any) {
    console.error("Analysis Error:", error);
    if (error.message?.includes("Rate exceeded") || error.message?.includes("Quota exceeded")) {
      return "Layanan AI sedang sibuk. Kami akan melakukan analisis setelah ini.";
    }
    return "Ready to transform your smile.";
  }
}

export async function analyzeRadiology(base64Data: string, mimeType: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: "Act as a professional dental radiologist. Analyze this dental X-ray/radiograph. Identify any potential issues like caries, bone loss, periapical lesions, or impacted teeth. Provide a clear, bulleted report. Use professional yet accessible language. IMPORTANT: Start with a clear disclaimer that this is an AI-assisted analysis and must be confirmed by a licensed dentist.",
          },
        ],
      },
    });

    return response.text || "Analysis complete.";
  } catch (error: any) {
    console.error("Radiology Error:", error);
    if (error.message?.includes("Rate exceeded") || error.message?.includes("Quota exceeded")) {
      throw new Error("Layanan AI sedang sibuk. Silakan coba lagi dalam beberapa menit.");
    }
    throw error;
  }
}
