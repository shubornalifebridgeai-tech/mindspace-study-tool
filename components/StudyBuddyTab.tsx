import React, { useState, useRef, useEffect } from 'react';
import type { StudyData, ChatMessage } from '../types';
import { useLocale } from '../context/LocaleContext';
import { generateClarityAiStream } from '../services/geminiService';
import ErrorModal from './ErrorModal';
import Tooltip from './Tooltip';

interface ClarityAiTabProps {
    studyData: StudyData | null;
    chatHistory: ChatMessage[];
    setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const ClarityAiTab: React.FC<ClarityAiTabProps> = ({ studyData, chatHistory, setChatHistory }) => {
    const { t } = useLocale();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Clear chat history whenever the study context changes, unless it was loaded with the note
    useEffect(() => {
        if (studyData && (!chatHistory || chatHistory.length === 0)) {
            setChatHistory([]);
        }
    }, [studyData]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isLoading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || !studyData) return;

        const newQuestion = query;
        const currentHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: newQuestion }];
        setChatHistory(currentHistory);
        setQuery('');
        setIsLoading(true);

        try {
            const stream = await generateClarityAiStream(studyData, chatHistory, newQuestion, t('geminiLocale'));
            
            let firstChunk = true;
            for await (const chunk of stream) {
                const chunkText = chunk.text;
                if (firstChunk) {
                    setChatHistory(prev => [...prev, { role: 'model', content: chunkText }]);
                    firstChunk = false;
                } else {
                    setChatHistory(prev => {
                        const updatedHistory = [...prev];
                        const lastMessage = updatedHistory[updatedHistory.length - 1];
                        if (lastMessage && lastMessage.role === 'model') {
                            lastMessage.content += chunkText;
                        }
                        return updatedHistory;
                    });
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : t('errorClarityAi'));
             // Revert history if there was an error
            setChatHistory(chatHistory);
        } finally {
            setIsLoading(false);
        }
    };

    if (!studyData?.summary) {
        return (
            <div className="text-center p-8 bg-white dark:bg-[#161b22] rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">{t('clarityAiTitle')}</h3>
                <p className="text-gray-600 dark:text-gray-300">
                    {t('clarityAiWelcome')}
                </p>
            </div>
        );
    }
    
    return (
        <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-200px)]">
            <div className="p-4 bg-white dark:bg-[#161b22] rounded-t-xl shadow-lg flex justify-between items-center border-b border-gray-200 dark:border-[#30363d]">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{t('clarityAiTitle')}</h2>
                <Tooltip text={t('tooltip_clearChat')}>
                    <button
                        onClick={() => setChatHistory([])}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </Tooltip>
            </div>
            <div className="flex-grow p-4 bg-gray-50 dark:bg-[#0D1117] overflow-y-auto">
                 <div className="space-y-4">
                    {chatHistory.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xl px-4 py-2 rounded-2xl whitespace-pre-wrap ${msg.role === 'user' ? 'bg-emerald-600 dark:bg-emerald-700 text-white' : 'bg-gray-200 dark:bg-[#21262d] text-gray-800 dark:text-gray-100'}`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isLoading && chatHistory[chatHistory.length - 1]?.role === 'user' && (
                        <div className="flex justify-start">
                            <div className="max-w-xl px-4 py-2 rounded-2xl bg-gray-200 dark:bg-[#21262d] flex items-center gap-2">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
            </div>
            <div className="p-4 bg-white dark:bg-[#161b22] rounded-b-xl shadow-lg border-t border-gray-200 dark:border-[#30363d]">
                 <form onSubmit={handleSendMessage} className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('clarityAiPlaceholder')}
                        disabled={isLoading}
                        className="w-full pl-4 pr-12 py-3 border-2 border-gray-300 dark:border-[#30363d] focus:border-emerald-500 focus:ring-emerald-500 rounded-full shadow-md dark:bg-[#21262d] dark:text-gray-200 text-base transition duration-300"
                    />
                    <button type="submit" disabled={isLoading || !query} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-400 disabled:dark:bg-gray-600 disabled:cursor-not-allowed transition">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                    </button>
                </form>
            </div>
            <ErrorModal isOpen={!!error} onClose={() => setError(null)} message={error} />
        </div>
    );
};

export default ClarityAiTab;