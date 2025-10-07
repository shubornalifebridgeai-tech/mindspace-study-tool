
import React, { useMemo } from 'react';
import type { User, Tab } from '../types';
import { useLocale } from '../context/LocaleContext';
import Tooltip from './Tooltip';

interface HomeScreenProps {
    user: User;
    theme: 'light' | 'dark' | 'colorful';
    setTheme: (theme: 'light' | 'dark' | 'colorful') => void;
    onNavigate: (tabId: Tab['id']) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ user, theme, setTheme, onNavigate }) => {
    const { t } = useLocale();

    const { greeting, emoji } = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return { greeting: t('homeGreetingMorning'), emoji: '🌞' };
        if (hour < 18) return { greeting: t('homeGreetingAfternoon'), emoji: ' afternoon 🌤️' };
        return { greeting: t('homeGreetingEvening'), emoji: ' evening 🌙' };
    }, [t]);

    const quotes = [
        "The beautiful thing about learning is that nobody can take it away from you. - B.B. King",
        "The only way to do great work is to love what you do. - Steve Jobs",
        "Live as if you were to die tomorrow. Learn as if you were to live forever. - Mahatma Gandhi",
        "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill"
    ];

    const dailyQuote = useMemo(() => {
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        return quotes[dayOfYear % quotes.length];
    }, []);

    const themeClasses = theme === 'colorful' ? 'themed-bg themed-text' : 'bg-white dark:bg-[#161b22] text-gray-800 dark:text-gray-200';
    const accentTextClass = theme === 'colorful' ? 'themed-accent-text' : 'text-emerald-600 dark:text-emerald-400';

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-500`}>
            <main className={`w-full max-w-4xl mx-auto text-center rounded-2xl shadow-2xl ${themeClasses} p-6 md:p-10`}>

                {/* Header Section */}
                <header className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-2">
                        {greeting}, <span className={accentTextClass}>{user.name.split(' ')[0]}</span>! {emoji}
                    </h1>
                    <p className="text-lg text-gray-400 dark:text-gray-400">Ready to expand your mind today?</p>
                </header>

                {/* Gamification Stats */}
                <section className="flex justify-center gap-8 mb-10">
                    <div className="text-center">
                        <p className="text-4xl font-bold">🔥</p>
                        <p className="text-2xl font-bold">12</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('homeStreak')}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-4xl font-bold">✨</p>
                        <p className="text-2xl font-bold">1,450</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('homeXP')}</p>
                    </div>
                </section>

                {/* Main Actions */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <button onClick={() => onNavigate('input')} className="glow-on-hover p-6 rounded-xl bg-emerald-600 text-white font-bold text-lg shadow-lg hover:bg-emerald-700">
                        {t('homeCTA_new')}
                    </button>
                    <button onClick={() => onNavigate('flashcards')} className="glow-on-hover p-6 rounded-xl bg-blue-600 text-white font-bold text-lg shadow-lg hover:bg-blue-700">
                        {t('homeCTA_flashcards')}
                    </button>
                    <button onClick={() => onNavigate('quizzes')} className="glow-on-hover p-6 rounded-xl bg-purple-600 text-white font-bold text-lg shadow-lg hover:bg-purple-700">
                        {t('homeCTA_quiz')}
                    </button>
                </section>

                {/* Daily Quote & Theme Selector */}
                <footer className="flex flex-col md:flex-row justify-between items-center gap-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-left">
                        <h3 className="font-bold text-gray-500 dark:text-gray-400">{t('homeQuoteTitle')}</h3>
                        <p className="italic text-sm">"{dailyQuote}"</p>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-[#0D1117] rounded-full">
                         <span className="text-sm font-semibold px-2">{t('homeTheme')}</span>
                         <Tooltip text={t('tooltip_theme_light')}>
                            <button onClick={() => setTheme('light')} className={`w-8 h-8 rounded-full bg-white border-2 ${theme === 'light' ? 'border-blue-500' : 'border-gray-300'}`}></button>
                         </Tooltip>
                         <Tooltip text={t('tooltip_theme_dark')}>
                            <button onClick={() => setTheme('dark')} className={`w-8 h-8 rounded-full bg-gray-800 border-2 ${theme === 'dark' ? 'border-blue-500' : 'border-gray-600'}`}></button>
                         </Tooltip>
                         <Tooltip text={t('tooltip_theme_colorful')}>
                            <button onClick={() => setTheme('colorful')} className={`w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-yellow-500 border-2 ${theme === 'colorful' ? 'border-white' : 'border-transparent'}`}></button>
                         </Tooltip>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default HomeScreen;