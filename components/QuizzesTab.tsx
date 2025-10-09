import React, { useState, useMemo } from 'react';
import type { StudyData, QuizQuestion } from '../types';
import { useLocale } from '../context/LocaleContext';
import { generateQuiz } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import Tooltip from './Tooltip';

interface QuizzesTabProps {
    studyData: StudyData | null;
}

const QuizzesTab: React.FC<QuizzesTabProps> = ({ studyData }) => {
    const { t } = useLocale();
    const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // New state for interactive quiz mode
    const [quizMode, setQuizMode] = useState<'practice' | 'confidence'>('practice');
    const [userAnswers, setUserAnswers] = useState<string[]>([]);
    const [quizComplete, setQuizComplete] = useState(false);

    const quizScore = useMemo(() => {
        if (!quiz || userAnswers.length !== quiz.length) return 0;
        return quiz.reduce((score, question, index) => {
            return score + (question.correctAnswer === userAnswers[index] ? 1 : 0);
        }, 0);
    }, [quiz, userAnswers]);

    const handleGenerateQuiz = async () => {
        if (!studyData?.summary) return;

        setIsLoading(true);
        setError(null);
        setQuiz(null);
        setUserAnswers([]);
        setQuizComplete(false);

        try {
            const generatedQuiz = await generateQuiz(studyData.summary, t('geminiLocale'));
            setQuiz(generatedQuiz);
            setUserAnswers(new Array(generatedQuiz.length).fill(null));
        } catch (err) {
            setError(err instanceof Error ? err.message : t('errorQuizGeneration'));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAnswerSelect = (questionIndex: number, selectedOption: string) => {
        if (userAnswers[questionIndex] !== null) return; // Already answered

        const newAnswers = [...userAnswers];
        newAnswers[questionIndex] = selectedOption;
        setUserAnswers(newAnswers);
        
        // Check if quiz is now complete
        if (!newAnswers.includes(null)) {
            setQuizComplete(true);
        }
    };

    const handleRetakeQuiz = () => {
        if (quiz) {
            setUserAnswers(new Array(quiz.length).fill(null));
            setQuizComplete(false);
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
                 {quiz && (
                     <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex bg-gray-200 dark:bg-[#21262d] rounded-lg p-1">
                            <Tooltip text={t('tooltip_quizMode_practice')}>
                                <button 
                                    onClick={() => setQuizMode('practice')}
                                    className={`px-4 py-2 rounded-md font-semibold transition text-sm ${quizMode === 'practice' ? 'bg-white dark:bg-[#161b22] text-emerald-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}
                                >
                                    {t('quizModePractice')}
                                </button>
                            </Tooltip>
                            <Tooltip text={t('tooltip_quizMode_confidence')}>
                                <button 
                                    onClick={() => setQuizMode('confidence')}
                                    className={`px-4 py-2 rounded-md font-semibold transition text-sm ${quizMode === 'confidence' ? 'bg-white dark:bg-[#161b22] text-emerald-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}
                                >
                                    {t('quizModeConfidence')}
                                </button>
                            </Tooltip>
                        </div>
                        {quizComplete && quizMode === 'confidence' && (
                             <button onClick={handleRetakeQuiz} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-blue-700 transition">
                                {t('retakeQuizBtn')}
                            </button>
                        )}
                    </div>
                 )}
            </div>
            
             {quizComplete && quizMode === 'confidence' && (
                <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-center font-bold text-blue-800 dark:text-blue-200 text-lg">
                   {t('quizResult', { score: quizScore, total: quiz.length })}
                </div>
            )}

            {quiz && (
                <div className="space-y-6">
                    {quiz.map((item, index) => (
                        <div key={index} className="p-6 bg-white dark:bg-[#161b22] rounded-xl shadow-lg">
                            <p className="font-bold text-lg mb-4">
                                {index + 1}. {item.question}
                            </p>
                            {quizMode === 'practice' ? (
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
                            ) : (
                                <ul className="space-y-2">
                                    {item.options.map((option, optionIndex) => {
                                        const isAnswered = userAnswers[index] !== null;
                                        const isSelected = userAnswers[index] === option;
                                        const isCorrect = item.correctAnswer === option;

                                        let buttonClass = 'w-full text-left p-3 rounded-lg border-2 transition-all duration-300 ';
                                        if (isAnswered) {
                                            if (isCorrect) {
                                                buttonClass += 'bg-green-100 dark:bg-green-900/50 border-green-500 text-green-800 dark:text-green-300 font-bold';
                                            } else if (isSelected) {
                                                buttonClass += 'bg-red-100 dark:bg-red-900/50 border-red-500 text-red-800 dark:text-red-300';
                                            } else {
                                                buttonClass += 'bg-gray-50 dark:bg-[#21262d] border-gray-200 dark:border-[#30363d]';
                                            }
                                        } else {
                                            buttonClass += 'bg-gray-50 dark:bg-[#21262d] border-gray-200 dark:border-[#30363d] hover:bg-gray-100 dark:hover:bg-[#30363d] cursor-pointer';
                                        }

                                        return (
                                            <li key={optionIndex}>
                                                <button 
                                                    onClick={() => handleAnswerSelect(index, option)} 
                                                    className={buttonClass}
                                                    disabled={isAnswered}
                                                >
                                                    {option}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default QuizzesTab;