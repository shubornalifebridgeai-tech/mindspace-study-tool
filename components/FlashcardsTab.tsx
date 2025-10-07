
import React from 'react';
import type { Flashcard as FlashcardType } from '../types';
import Flashcard from './Flashcard';
import { useLocale } from '../context/LocaleContext';

interface FlashcardsTabProps {
    flashcards?: FlashcardType[];
}

const FlashcardsTab: React.FC<FlashcardsTabProps> = ({ flashcards }) => {
    const { t } = useLocale();

    if (!flashcards || flashcards.length === 0) {
        return (
            <div className="text-center p-8 bg-white dark:bg-[#161b22] rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">{t('flashcardsEmptyTitle')}</h3>
                <p className="text-gray-600 dark:text-gray-300">
                    {t('flashcardsEmptyDescription')}
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h3 className="text-2xl font-bold mb-3 text-gray-800 dark:text-gray-200">{t('flashcardsTitle')}</h3>
            <p className="text-gray-600 dark:text-gray-400 -mt-4 mb-4">{t('flashcardsDescription')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {flashcards.map((card, index) => (
                    <Flashcard key={index} question={card.question} answer={card.answer} />
                ))}
            </div>
        </div>
    );
};

export default FlashcardsTab;