import { GoogleGenAI, Type } from "@google/genai";
import type { StudyData, GenerationOptions, ChatMessage, QuizQuestion } from '../types';

if (!process.env.API_KEY) {
  console.warn("API key is not set. Please add your Gemini API key in your environment settings.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const studyToolSchemaProperties = {
    summary: {
        type: Type.STRING,
        description: "A concise, well-written summary of the provided text, capturing the main points in a single paragraph.",
    },
    keyInsight: {
        type: Type.STRING,
        description: "The single most important or surprising takeaway from the text. A one-sentence insight.",
    },
    mindMap: {
        type: Type.ARRAY,
        description: "A hierarchical structure of the main topics and their sub-topics, suitable for a mind map visualization. Should have one root concept.",
        items: {
            type: Type.OBJECT,
            properties: {
                concept: { type: Type.STRING },
                subConcepts: {
                    type: Type.ARRAY,
                    description: "Recursive list of sub-concepts.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            concept: { type: Type.STRING },
                            subConcepts: {
                                type: Type.ARRAY,
                                items: {
                                     type: Type.OBJECT,
                                     properties: {
                                         concept: { type: Type.STRING },
                                     }
                                }
                            }
                        }
                    }
                }
            },
            required: ["concept"],
        },
    },
    flashcards: {
        type: Type.ARRAY,
        description: "A list of question-and-answer pairs for creating flashcards based on the text's key information.",
        items: {
            type: Type.OBJECT,
            properties: {
                question: { type: Type.STRING },
                answer: { type: Type.STRING },
            },
            required: ["question", "answer"],
        },
    },
};


export const generateStudyTools = async (text: string, options: GenerationOptions, locale: string = 'English'): Promise<StudyData> => {
    
    const requestedProperties: any = {};
    const requiredFields: string[] = [];

    if (options.generateSummary) {
        requestedProperties.summary = studyToolSchemaProperties.summary;
        requestedProperties.keyInsight = studyToolSchemaProperties.keyInsight;
        requiredFields.push('summary', 'keyInsight');
    }
    if (options.generateMindMap) {
        requestedProperties.mindMap = studyToolSchemaProperties.mindMap;
        requiredFields.push('mindMap');
    }
    if (options.generateFlashcards) {
        requestedProperties.flashcards = studyToolSchemaProperties.flashcards;
        requiredFields.push('flashcards');
    }

    const dynamicSchema = {
        type: Type.OBJECT,
        properties: requestedProperties,
        required: requiredFields,
    };
    
    const prompt = `Based on the following text, please generate a specific set of study tools IN ${locale}. The entire JSON response, including all keys and values, must be in ${locale}. Structure your response as a JSON object containing only the requested tools.

Requested tools: ${requiredFields.join(', ')}.

Text to analyze:
---
${text}
---
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: dynamicSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText) as StudyData;
        return parsedData;

    } catch (error) {
        console.error("Error generating study tools:", error);
        throw new Error("Failed to generate study tools from the provided text. The model might have been unable to process the request.");
    }
};

export const generateQuiz = async (text: string, locale: string = 'English'): Promise<QuizQuestion[]> => {
    const quizSchema = {
        type: Type.ARRAY,
        description: `A list of multiple-choice questions in ${locale}.`,
        items: {
            type: Type.OBJECT,
            properties: {
                question: { type: Type.STRING, description: 'The question.' },
                options: {
                    type: Type.ARRAY,
                    description: 'An array of 4 possible answers.',
                    items: { type: Type.STRING },
                },
                correctAnswer: { type: Type.STRING, description: 'The correct answer from the options array.' },
            },
            required: ['question', 'options', 'correctAnswer'],
        },
    };

    const prompt = `Generate a 5-question multiple-choice quiz based on the key information in the following text. Each question should have 4 options. Ensure the entire JSON response is in ${locale}.

Text to analyze:
---
${text}
---
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: quizSchema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as QuizQuestion[];
    } catch (error) {
        console.error('Error generating quiz:', error);
        throw new Error('Failed to generate a quiz from the provided text.');
    }
};


export const extractTextFromImage = async (imageData: {data: string, mimeType: string}): Promise<string> => {
    try {
        const imagePart = {
            inlineData: {
                mimeType: imageData.mimeType,
                data: imageData.data,
            },
        };

        const textPart = {
            text: "Extract all text from this image, including any handwritten text. Provide only the transcribed text as a single block of text.",
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error extracting text from image:", error);
        throw new Error("Failed to extract text from the image. Please try a clearer image.");
    }
};

export const generateFollowUpAnswer = async (context: string, history: ChatMessage[], locale: string = 'English'): Promise<string> => {
    const systemInstruction = `You are a helpful study assistant. Your goal is to answer questions based on the original text provided and the conversation history. Keep your answers concise and directly related to the study material. Answer in ${locale}.`;

    const contents = [
        { role: 'user', parts: [{ text: `Here is the original study material:\n\n${context}` }] },
        { role: 'model', parts: [{ text: "Great, I'm ready to help. What is your question?" }] },
        ...history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }))
    ];
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
             config: {
                systemInstruction: systemInstruction,
            },
        });
        return response.text.trim();
    } catch (error) {
         console.error("Error generating follow-up answer:", error);
        throw new Error("I had trouble answering that question. Please try rephrasing it.");
    }
};

export const generateStudyBuddyStream = async (
    studyData: StudyData,
    history: ChatMessage[],
    question: string,
    locale: string = 'English'
) => {
    const systemInstruction = `You are "Sparky", a fun, encouraging, and quirky AI study buddy. You love using emojis ✨. Your goal is to help the user understand their study material, brainstorm new ideas, and stay motivated. Keep your answers conversational and positive. Base your knowledge on the provided study material. Answer in ${locale}.`;

    const context = `Here is the study material context:\n\n${studyData.summary}\n\nKey Insight: ${studyData.keyInsight}`;

    const contents = [
        { role: 'user', parts: [{ text: context }] },
        { role: 'model', parts: [{ text: `Got it! I'm Sparky, your study buddy! What's on your mind? 🚀` }] },
        ...history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        })),
        { role: 'user', parts: [{ text: question }] }
    ];

    try {
        const response = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        return response;
    } catch (error) {
        console.error("Error generating study buddy response:", error);
        throw new Error("Failed to get response from Study Buddy.");
    }
};