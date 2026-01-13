import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { UserProfile, Message, Sender } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-3-pro-preview';

export interface AIResponse {
  chatResponse: string;
  suggestedPlan?: string[];
  newHabits?: string[];
}

const parseJSON = (text: string): any => {
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      try {
        return JSON.parse(text.substring(start, end + 1));
      } catch (e2) {}
    }
    return {
      chatResponse: text,
      suggestedPlan: [],
      newHabits: []
    };
  }
};

const ensureTextContainsPlan = (data: AIResponse): AIResponse => {
    if (data.suggestedPlan && data.suggestedPlan.length > 0) {
        const firstItem = data.suggestedPlan[0];
        const looksLikeItIsMissing = !data.chatResponse.toLowerCase().includes(firstItem.toLowerCase().substring(0, Math.min(10, firstItem.length)));
        
        if (looksLikeItIsMissing) {
            const listText = data.suggestedPlan.map(item => `• ${item}`).join('\n');
            data.chatResponse = `${data.chatResponse.trim()}\n\n**Proposed Plan:**\n${listText}`;
        }
    }
    return data;
};

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

export const generateCoachResponse = async (
  currentMessage: string,
  profile: UserProfile,
  history: Message[],
  imageBase64?: string
): Promise<AIResponse> => {
  try {
    const formattedHistory = history.map(msg => 
      `${msg.sender === Sender.USER ? 'Client' : 'Coach'}: ${msg.text}`
    ).slice(-10).join('\n'); // Keep last 10 for context

    const systemPrompt = `
      You are ${profile.coachName || 'CustomCoach'}, an expert personal trainer.
      CLIENT: ${profile.name}, Goal: ${profile.goal}
      
      CORE REQUIREMENTS:
      1. TENTATIVE PLANNING: If the user hasn't confirmed their plan yet, propose/edit it in 'suggestedPlan'.
      2. ASK PERMISSION: Always ask "Anything to add or edit before we add it to your dashboard?" when proposing a plan.
      3. MISSIONS VS HABITS: Put daily tasks (like "Sleep 8 hours", "Drink water", "Push workout") in 'suggestedPlan'. Do NOT put these in 'newHabits' unless the user explicitly asks for a long-term habit tracker bubble.
      4. HIGH ENERGY: Be intense and motivational.
      5. FORMAT: Always return JSON.
    `;

    const parts: any[] = [{ text: `${systemPrompt}\n\n[CONVERSATION HISTORY]\n${formattedHistory}\n\nClient's New Input: ${currentMessage}` }];
    
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64.split(',')[1] || imageBase64
        }
      });
    }

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts }],
      config: {
        tools: [{ googleSearch: {} }],
        safetySettings: SAFETY_SETTINGS,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chatResponse: { type: Type.STRING },
            suggestedPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
            newHabits: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    if (response.text) {
      let data = parseJSON(response.text) as AIResponse;
      data = ensureTextContainsPlan(data);
      return data;
    }
    throw new Error("No text response from model");
  } catch (error) {
    console.error("Coach API Error:", error);
    throw error;
  }
};

export const generateInitialCoachGreeting = async (profile: UserProfile): Promise<AIResponse> => {
  try {
    const systemPrompt = `
      You are ${profile.coachName || 'CustomCoach'}. High-energy expert trainer.
      CLIENT: ${profile.name}, GOAL: ${profile.goal}
      
      INSTRUCTIONS:
      1. Welcome the client with fire!
      2. PROPOSE a Day 1 plan in 'suggestedPlan'.
      3. CRITICAL: In 'chatResponse', ask: "Here is the plan for the day, anything to add or edit before we add it to your dashboard?"
      4. List the tasks clearly in your 'chatResponse'.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
      config: {
        safetySettings: SAFETY_SETTINGS,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chatResponse: { type: Type.STRING },
            suggestedPlan: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    if (response.text) {
      let data = parseJSON(response.text) as AIResponse;
      data.newHabits = [];
      return ensureTextContainsPlan(data);
    }
    throw new Error("Init failed");
  } catch (error) {
    return {
      chatResponse: "I'm hyped to start! Here's a starter plan. Does this look good to add to your dashboard?",
      suggestedPlan: ["Drink 3L Water", "10 Minute Walk"]
    };
  }
};

export const generateMotivation = async (profile: UserProfile, currentPlan: string[]): Promise<string> => {
  try {
    const planSummary = currentPlan.length > 0 ? currentPlan.slice(0, 2).join(", ") : "your mission";
    const systemPrompt = `
      You are ${profile.coachName || 'CustomCoach'}. 
      Hype the user up! They need to finish: ${planSummary}.
      GOAL: ${profile.goal}
      
      INSTRUCTIONS:
      1. Use search grounding to find a intense, high-performer fact.
      2. Use structured markdown (### Headers, **Bold**).
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
      config: { tools: [{ googleSearch: {} }], safetySettings: SAFETY_SETTINGS }
    });

    return response.text || "You are built for this. Execute the plan.";
  } catch (error) {
    return "The top 1% don't wait for motivation. They just work. Let's go!";
  }
};
