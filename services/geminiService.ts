
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export interface PromoScript {
  title: string;
  script: string;
  hashtags: string[];
  viralFactor: string;
}

/**
 * Generates a structured promotional script using Gemini 3 Pro.
 */
export const generatePromoDescription = async (topic: string): Promise<PromoScript | null> => {
  const apiKey = process.env.API_KEY || '';
  if (!apiKey) {
    console.warn('API_KEY not configured');
    return null;
  }
  
  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `You are a world-class creative director and social media strategist for Waan Keenya Bingo. 
Create a viral social media post about: "${topic}". 
The post should drive excitement for the weekly 10,000 ETB prize pool.
Return JSON with: title (catchy headline), script (main post body), hashtags (array of trending tags), viralFactor (why it will go viral).`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    if (text) {
      return JSON.parse(text.trim()) as PromoScript;
    }
    return null;
  } catch (error) {
    console.error("Gemini Promo Generation Error:", error);
    return null;
  }
};
