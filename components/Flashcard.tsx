
import React, { useState } from 'react';
import { useLocale } from '../context/LocaleContext';
import Tooltip from './Tooltip';

interface FlashcardProps {
    question: string;
    answer: string;
}

const Flashcard: React.FC<FlashcardProps> = ({ question, answer }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [difficulty, setDifficulty] = useState<'easy' | 'good' | 'hard' | null>(null);
    const { t } = useLocale();

    const handleSetDifficulty = (level: 'easy' | 'good' | 'hard', e: React.MouseEvent) => {
        e.stopPropagation(); 
        setDifficulty(level);
    };

    return (
        <Tooltip text={t('tooltip_flipCard')}>
            <div 
                className="w-full h-64 perspective-1000 cursor-pointer group"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div 
                    className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}
                >
                    {/* Front of the card */}
                    <div className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-4 rounded-xl shadow-lg bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d]">
                        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">{t('flashcardQuestion')}</h4>
                        <p className="text-center font-semibold text-gray-800 dark:text-gray-200">{question}</p>
                    </div>
                    
                    {/* Back of the card */}
                    <div className="absolute w-full h-full backface-hidden flex flex-col p-4 rounded-xl shadow-lg bg-emerald-500 dark:bg-emerald-800 rotate-y-180">
                         <div className="flex-grow flex flex-col items-center justify-center">
                            <h4 className="text-sm font-semibold text-white dark:text-emerald-100 mb-2">{t('flashcardAnswer')}</h4>
                            <p className="text-center font-semibold text-white dark:text-emerald-100">{answer}</p>
                        </div>
                        <div className="flex justify-around items-center pt-3 mt-auto border-t border-white/30">
                            <Tooltip text={t('tooltip_difficulty_hard')}>
                                <button 
                                    onClick={(e) => handleSetDifficulty('hard', e)}
                                    className={`py-1 px-4 rounded-full text-xs font-bold transition ${difficulty === 'hard' ? 'bg-white text-red-600 ring-2 ring-white' : 'bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 text-white'}`}
                                >
                                    {t('flashcardHard')}
                                </button>
                            </Tooltip>
                             <Tooltip text={t('tooltip_difficulty_good')}>
                                <button 
                                    onClick={(e) => handleSetDifficulty('good', e)}
                                    className={`py-1 px-4 rounded-full text-xs font-bold transition ${difficulty === 'good' ? 'bg-white text-blue-600 ring-2 ring-white' : 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white'}`}
                                >
                                    {t('flashcardGood')}
                                </button>
                             </Tooltip>
                             <Tooltip text={t('tooltip_difficulty_easy')}>
                                <button 
                                    onClick={(e) => handleSetDifficulty('easy', e)}
                                    className={`py-1 px-4 rounded-full text-xs font-bold transition ${difficulty === 'easy' ? 'bg-white text-green-600 ring-2 ring-white' : 'bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 text-white'}`}
                                >
                                    {t('flashcardEasy')}
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            </div>
        </Tooltip>
    );
};

if (typeof window !== 'undefined') {
  if (!document.getElementById('flashcard-styles')) {
    const style = document.createElement('style');
    style.id = 'flashcard-styles';
    style.innerHTML = `
      .perspective-1000 { perspective: 1000px; }
      .transform-style-preserve-3d { transform-style: preserve-3d; }
      .rotate-y-180 { transform: rotateY(180deg); }
      .backface-hidden { backface-visibility: hidden; }
    `;
    document.head.appendChild(style);
  }
}

export default React.memo(Flashcard);
