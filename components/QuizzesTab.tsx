
import React, { useState } from 'react';
import type { StudyData, QuizQuestion } from '../types';
import { useLocale } from '../context/LocaleContext';
import { generateQuiz } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

interface QuizzesTabProps {
    studyData: StudyData | null;
}

const QuizzesTab: React.FC<QuizzesTabProps> = ({ studyData }) => {
    const { t } = useLocale();
    const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateQuiz = async () => {
        if (!studyData?.summary) return;

        setIsLoading(true);
        setError(null);
        setQuiz(null);

        try {
            const generatedQuiz = await generateQuiz(studyData.summary, t('geminiLocale'));
            setQuiz(generatedQuiz);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('errorQuizGeneration'));
        } finally {
            setIsLoading(false);
        }
    };

    if (!studyData?.summary) {
        return (
            <div className="text-center p-8 bg-white dark:bg-[#161b22] rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">{t('quizzesEmptyTitle')}</h3>
                <p className="text-gray-600 dark:text-gray-300">
                    {t('quizzesEmptyDescription')}
                </p>
            </div>
        );
    }
    
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="p-6 bg-white dark:bg-[#161b22] rounded-xl shadow-lg">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">{t('quizzesTitle')}</h2>
                 {!quiz && (
                    <button
                        onClick={handleGenerateQuiz}
                        disabled={isLoading}
                        className="w-full bg-emerald-600 text-white px-6 py-4 rounded-xl font-extrabold text-lg shadow-xl hover:bg-emerald-700 transition active:scale-95 disabled:bg-emerald-800 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
                    >
                        {isLoading ? <LoadingSpinner /> : null}
                        <span>{isLoading ? t('generatingQuiz') : t('generateQuizBtn')}</span>
                    </button>
                )}
                 {error && <p className="text-red-500 mt-4">{error}</p>}
            </div>

            {quiz && (
                <div className="space-y-6">
                    {quiz.map((item, index) => (
                        <div key={index} className="p-6 bg-white dark:bg-[#161b22] rounded-xl shadow-lg">
                            <p className="font-bold text-lg mb-4">
                                {index + 1}. {item.question}
                            </p>
                            <ul className="space-y-2">
                                {item.options.map((option, optionIndex) => {
                                    const isCorrect = option === item.correctAnswer;
                                    return (
                                        <li
                                            key={optionIndex}
                                            className={`p-3 rounded-lg border-2 ${isCorrect ? 'bg-green-100 dark:bg-green-900/50 border-green-500' : 'bg-gray-50 dark:bg-[#21262d] border-gray-200 dark:border-[#30363d]'}`}
                                        >
                                            <span className={`${isCorrect ? 'font-bold text-green-800 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {option}
                                                {isCorrect && ` - ${t('correctAnswer')}`}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default QuizzesTab;