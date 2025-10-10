 import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

function HomeScreen() {
    const [inputText, setInputText] = useState('');
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const API_KEY = 'AIzaSyBQbQpwjRZB2hxRtCx13dbVTi2R6TPt9H0';

    const generateSummary = async () => {
        if (!inputText.trim()) {
            setError('Please enter some text!');
            return;
        }
        setIsLoading(true);
        setError('');
        setSummary('Generating summary...');

        try {
            const genAI = new GoogleGenerativeAI(API_KEY);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const prompt = `Write a concise summary of: ${inputText}`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const fullText = response.text();
            setSummary(fullText);
        } catch (err) {
            console.error('Gemini API Error:', err);
            setError(`Failed to generate summary: ${err.message}`);
            setSummary('');
        } finally {
            setIsLoading(false);
        }
    };

    const [theme, setTheme] = useState('light');
    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <div className={`min-h-screen p-8 transition-all duration-300 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-emerald-600">StudySpark Pro</h1>
                <button 
                    onClick={toggleTheme} 
                    className="glow-on-hover p-2 rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
                >
                    {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
                </button>
            </header>

            <main className="max-w-2xl mx-auto space-y-6">
                <div>
                    <label className="block text-lg font-semibold mb-2">Paste Text for Summary:</label>
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Enter your text here..."
                        className="w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:border-emerald-500 focus:outline-none"
                        rows={4}
                    />
                </div>

                <button
                    onClick={generateSummary}
                    disabled={isLoading}
                    className={`w-full py-3 px-6 rounded-lg font-bold text-white transition-all duration-300 transform hover:scale-105 ${
                        isLoading 
                            ? 'generating-animation cursor-not-allowed bg-gray-500'
                            : 'glow-on-hover bg-emerald-600 hover:bg-emerald-700'
                    }`}
                >
                    {isLoading ? '🔄 Generating...' : '✨ Generate Summary'}
                </button>

                {error && (
                    <div className="p-4 bg-red-100 dark:bg-red-900 text-red-700 rounded-lg">
                        <strong>Error:</strong> {error}
                    </div>
                )}
                {summary && !isLoading && (
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-900/50 rounded-lg border-l-4 border-emerald-400">
                        <h3 className="font-semibold text-lg mb-3">📝 AI Summary:</h3>
                        <pre className="whitespace-pre-wrap text-sm">{summary}</pre>
                    </div>
                )}

                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold mb-2">Tips:</h4>
                    <ul className="text-sm space-y-1">
                        <li>• Prompt customize করুন prompt-এ।</li>
                        <li>• API key .env-এ রাখুন।</li>
                    </ul>
                </div>
            </main>
        </div>
    );
}

export default HomeScreen;