import { GoogleGenAI, Type } from "@google/genai";
import type { StudyData, GenerationOptions, ChatMessage, QuizQuestion } from '../types';
 
const API_KEY = "AIzaSyCCCTeHIM0TueBToy6SRkcGrpA35j2REdw"; //

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: API_KEY });

ai.generateText({ model: "gemini-1", prompt: "Write a short motivational message for students.", maxOutputTokens: 100 })
  .then(res => console.log("Generated text:\n", res.output[0].content[0].text))
  .catch(err => console.error("Error:", err));

    console.log("Generated text:\n");
    console.log(response.output[0].content[0].text);
  } catch (error) {
    console.error("Error generating text:", error)
    
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

export const generateFollowUpAnswer = async (
    context: string, 
    history: ChatMessage[], 
    locale: string = 'English'
): Promise<{ answer: string; relevantSentences: string[] }> => {
    const systemInstruction = `You are a helpful study assistant. Your goal is to answer questions based on the original text provided.
1.  Provide a concise answer to the user's question.
2.  Identify and extract the specific sentences from the original study material that directly support your answer.
3.  Return a JSON object containing your answer and the list of exact, verbatim sentences.
4.  Answer in ${locale}. The entire JSON response, including keys and values, must be in ${locale}.`;

    const followUpSchema = {
        type: Type.OBJECT,
        properties: {
            answer: {
                type: Type.STRING,
                description: "A concise answer to the user's question.",
            },
            relevantSentences: {
                type: Type.ARRAY,
                description: "An array of exact, verbatim sentences from the original text that support the answer.",
                items: {
                    type: Type.STRING,
                },
            },
        },
        required: ['answer', 'relevantSentences'],
    };

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
                responseMimeType: "application/json",
                responseSchema: followUpSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText);

        return {
            answer: parsedData.answer || "I couldn't find a specific answer.",
            relevantSentences: parsedData.relevantSentences || [],
        };
    } catch (error) {
         console.error("Error generating follow-up answer:", error);
        throw new Error("I had trouble answering that question. Please try rephrasing it.");
    }
};

export const generateClarityAiStream = async (
    studyData: StudyData,
    history: ChatMessage[],
    question: string,
    locale: string = 'English'
) => {
    const context = `
CONTEXT:
---
Summary: ${studyData.summary || 'Not available.'}
Key Insight: ${studyData.keyInsight || 'Not available.'}
---
`.trim();

    const systemInstruction = `You are Clarity AI, an advanced study assistant. Your primary goal is to provide clear, accurate, and concise explanations based *only* on the provided study material in the CONTEXT section. Avoid making assumptions or providing information outside the given context. Help the user understand their notes deeply and accurately. Answer in ${locale}.

${context}`;

    const contents = [
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
        console.error("Error generating Clarity AI response:", error);
        throw new Error("Failed to get response from Clarity AI.");
    }
};
