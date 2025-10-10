import React, { useMemo } from 'react';
import type { User, Tab, StudyStreakData } from '../types';
import { useLocale } from '../context/LocaleContext';
import Tooltip from './Tooltip';

interface HomeScreenProps {
    user: User;
    theme: 'light' | 'dark' | 'colorful';
    setTheme: (theme: 'light' | 'dark' | 'colorful') => void;
    onNavigate: (tabId: Tab['id']) => void;
    studyStreakData: StudyStreakData;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ user, theme, setTheme, onNavigate, studyStreakData }) => {
    const { t } = useLocale();

    // Greeting based on current hour
    const { greeting, emoji } = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return { greeting: t('homeGreetingMorning'), emoji: '🌅' };
        if (hour < 18) return { greeting: t('homeGreetingAfternoon'), emoji: '☀️' };
        return { greeting: t('homeGreetingEvening'), emoji: '🌜' };
    }, [t]);

    // Quotes
    const quotes = [
        "The beautiful thing about learning is that nobody can take it away from you. - B.B. King",
        "The only way to do great work is to love what you do. - Steve Jobs",
        "Live as if you were to die tomorrow. Learn as if you were to live forever. - Mahatma Gandhi",
        "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
        "Education is the most powerful weapon which you can use to change the world. - Nelson Mandela",
        "Strive for progress, not perfection. - Unknown"
    ];

    const dailyQuote = useMemo(() => {
        const dayOfYear = Math.floor(
            (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
        );
        return quotes[dayOfYear % quotes.length];
    }, [quotes]);

    const themeClasses = useMemo(() => {
        switch (theme) {
            case 'colorful':
                return 'bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 text-white shadow-2xl';
            case 'dark':
                return 'bg-gray-900 text-gray-100 shadow-2xl border border-gray-700';
            default:
                return 'bg-white text-gray-900 shadow-2xl border border-gray-200';
        }
    }, [theme]);

    const accentTextClass = useMemo(() => {
        switch (theme) {
            case 'colorful':
                return 'text-white/90 font-black tracking-tight';
            case 'dark':
                return 'text-emerald-400 font-bold';
            default:
                return 'text-emerald-600 font-bold';
        }
    }, [theme]);

    // Safe first name
    const firstName = user.name ? user.name.split(' ')[0] : 'Learner';

    // Stat cards data
    const stats = useMemo(() => [
        {
            icon: '🔥',
            value: studyStreakData.currentStreak,
            label: t('homeStreak'),
            color: 'from-orange-400 to-red-500'
        },
        {
            icon: '✨',
            value: 1450, // Assuming this is dynamic in a real app; hardcoded for now
            label: t('homeXP'),
            color: 'from-emerald-400 to-teal-500'
        }
    ], [studyStreakData.currentStreak, t]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-all duration-500">
            <main className={`w-full max-w-6xl mx-auto text-center rounded-2xl ${themeClasses} p-8 md:p-12 relative overflow-hidden`}>
                {/* Subtle background pattern for pro feel */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_25%_25%,#e0e7ff_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_25%_25%,#4f46e5_0%,transparent_50%)]" />

                {/* Header */}
                <header className="mb-12 relative z-10 animate-fade-in-down">
                    <h1 className="text-5xl md:text-6xl font-black mb-4 leading-tight">
                        {greeting}, <span className={accentTextClass}>{firstName}</span>! {emoji}
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 font-medium">Unlock new horizons with focused, daily learning.</p>
                </header>

                {/* Gamification Stats */}
                <section className="flex flex-col md:flex-row justify-center gap-8 mb-16 relative z-10">
                    {stats.map((stat, index) => (
                        <div
                            key={stat.label}
                            className="text-center group animate-fade-in-up delay-100"
                            style={{ animationDelay: `${index * 150}ms` }}
                        >
                            <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                                <span className="text-3xl">{stat.icon}</span>
                            </div>
                            <p className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-2">
                                {stat.value.toLocaleString()}
                            </p>
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </section>

                {/* Main Actions */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 relative z-10">
                    {[
                        { id: 'input', label: t('homeCTA_new'), color: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700', icon: '📝' },
                        { id: 'flashcards', label: t('homeCTA_flashcards'), color: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700', icon: '🃏' },
                        { id: 'studyStreak', label: t('tab_studyStreak'), color: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700', icon: '📊' }
                    ].map((action, index) => (
                        <button
                            key={action.id}
                            onClick={() => onNavigate(action.id as Tab['id'])}
                            className={`${action.color} glow-on-hover-pro p-8 rounded-2xl text-white font-bold text-xl shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:-translate-y-2 active:scale-95 flex items-center justify-center gap-3 group relative overflow-hidden`}
                            style={{ animationDelay: `${index * 100}ms` }}
                            aria-label={action.label}
                        >
                            <span className="text-2xl group-hover:scale-110 transition-transform">{action.icon}</span>
                            <span>{action.label}</span>
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 backdrop-blur-sm" />
                        </button>
                    ))}
                </section>

                {/* Daily Quote & Theme Selector */}
                <footer className="flex flex-col lg:flex-row justify-between items-center gap-8 pt-8 border-t border-gray-200/50 dark:border-gray-700/50 relative z-10 animate-fade-in-up delay-300">
                    <div className="text-left flex-1">
                        <h3 className="font-semibold text-gray-600 dark:text-gray-300 mb-2">{t('homeQuoteTitle')}</h3>
                        <blockquote className="italic text-lg font-medium text-gray-700 dark:text-gray-200 border-l-4 border-emerald-400 pl-4">
                            "{dailyQuote}"
                        </blockquote>
                    </div>

                    {/* Theme Selector */}
                    <div className="flex items-center gap-4 p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 hidden md:block whitespace-nowrap">{t('homeTheme')}</span>
                        {[
                            { key: 'light', bg: 'bg-white', border: 'border-gray-300', activeBorder: 'border-blue-500', tooltip: t('tooltip_theme_light') },
                            { key: 'dark', bg: 'bg-gray-800', border: 'border-gray-600', activeBorder: 'border-blue-500', tooltip: t('tooltip_theme_dark') },
                            { key: 'colorful', bg: 'bg-gradient-to-r from-indigo-500 to-purple-500', border: 'border-transparent', activeBorder: 'border-white', tooltip: t('tooltip_theme_colorful') }
                        ].map((th) => (
                            <Tooltip key={th.key} text={th.tooltip}>
                                <button
                                    onClick={() => setTheme(th.key as 'light' | 'dark' | 'colorful')}
                                    className={`w-10 h-10 rounded-full ${th.bg} ${th.border} ${theme === th.key ? th.activeBorder : ''} shadow-md hover:shadow-lg transition-all duration-200 flex-shrink-0`}
                                    aria-label={`Switch to ${th.key} theme`}
                                />
                            </Tooltip>
                        ))}
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default HomeScreen;