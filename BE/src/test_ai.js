import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function test() {
    const realKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.replace('DAU_', '') : '';
    console.log("Using API Key:", realKey);
    try {
        const ai = new GoogleGenAI({ apiKey: realKey });
        
        const systemInstruction = `Bạn là AI trợ lý.`;
        const contents = [{ role: 'user', parts: [{ text: "chào" }] }];

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7,
            }
        });

        console.log("Response:", response.text);
    } catch (e) {
        console.error("ERROR:");
        console.error(e);
    }
}

test();
