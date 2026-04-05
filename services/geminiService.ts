import { GoogleGenAI, Type } from "@google/genai";
import { Asset, Interaction, SessionMemory } from "../types";

const MEMORY_KEY = 'html-ai-session-memory';

const getSessionMemory = (): SessionMemory => {
    const saved = localStorage.getItem(MEMORY_KEY);
    return saved ? JSON.parse(saved) : { preferences: [], interactionCount: 0 };
};

const updateSessionMemory = (newPreferences: string[]) => {
    const memory = getSessionMemory();
    memory.preferences = Array.from(new Set([...memory.preferences, ...newPreferences])).slice(-10);
    memory.interactionCount += 1;
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
};

export const generateCode = async (
    prompt: string, 
    currentCode: string, 
    modelType: string = 'gemini-3-flash-preview',
    history: Interaction[] = []
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const memory = getSessionMemory();
    
    // Build contextual memory prompt
    const contextHistory = history.slice(-5).map(h => `- ${h.prompt}`).join('\n');
    const learnedDirectives = memory.preferences.length > 0 
        ? `LEARNED USER PREFERENCES (Prioritize these): ${memory.preferences.join(', ')}` 
        : '';

    const systemInstruction = `You are a world-class 3D Game Architect.
    
    Current Intelligence Level: ${modelType.includes('pro') ? 'GOD_MODE' : 'Standard'}.
    Session Depth: ${memory.interactionCount} interactions.
    ${learnedDirectives}

    CORE OBJECTIVES:
    1. Produce high-performance Three.js code using CDN: https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js
    2. Optimize for Android/Mobile: 'touch-action: none', responsive canvas, joystick/tap controls.
    3. Memory Persistence: You are continuing a project. Respect the previous architectural choices while improving them.
    4. NO PLACEHOLDERS. Return full, functional HTML/JS.

    RECENT SESSION HISTORY:
    ${contextHistory}
    `;

    const config: any = {
        systemInstruction,
        temperature: 0.7,
    };

    // Enable thinking for Pro models to ensure "smarter" output
    if (modelType.includes('pro')) {
        config.thinkingConfig = { thinkingBudget: 4000 };
    }

    const response = await ai.models.generateContent({
      model: modelType,
      contents: [
        {
            role: 'user',
            parts: [{ text: `CONTEXT:\n${currentCode}\n\nNEW TASK:\n${prompt}` }]
        }
      ],
      config
    });

    let text = response.text || '';
    text = text.replace(/```html/g, '').replace(/```/g, '').trim();

    // After successful generation, attempt to "learn" from the prompt
    const learningResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Identify 1-2 core stylistic or technical preferences in this prompt: "${prompt}". Return as a JSON array of strings, e.g. ["neon aesthetics", "arcade physics"]. Provide ONLY the array.`,
        config: { responseMimeType: 'application/json' }
    });
    
    try {
        const newPrefs = JSON.parse(learningResponse.text || '[]');
        if (Array.isArray(newPrefs)) updateSessionMemory(newPrefs);
    } catch (e) { /* ignore learning errors */ }

    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate code. Please check your API configuration.");
  }
};

export const searchAssets = async (query: string): Promise<Asset[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Find 5 free-to-use 3D assets (GLB models, HDR maps) for: "${query}". 
    Return as raw JSON array of Asset objects with fields: id, name, type, url, thumbnail, license, author.
    Provide ONLY JSON. No markdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    const text = response.text || '[]';
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    return [];
  }
};