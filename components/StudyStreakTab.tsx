import React, { useState, useMemo } from 'react';
import type { StudyStreakData } from '../types';
import { useLocale } from '../context/LocaleContext';

interface StudyStreakTabProps {
    streakData: StudyStreakData;
}

const StatCard: React.FC<{ icon: string; label: string; value: string | number; unit: string; }> = ({ icon, label, value, unit }) => (
    <div className="bg-gray-50 dark:bg-[#21262d] p-6 rounded-xl shadow-md flex items-center gap-4">
        <div className="text-4xl">{icon}</div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                {value} <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">{unit}</span>
            </p>
        </div>
    </div>
);

const Calendar: React.FC<{ studyDays: Set<string> }> = ({ studyDays }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const { t } = useLocale();

    const { monthName, year, daysInMonth, firstDayOfMonth } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        return {
            monthName: currentDate.toLocaleDateString(t('geminiLocale'), { month: 'long' }),
            year: year,
            daysInMonth: new Date(year, month + 1, 0).getDate(),
            firstDayOfMonth: new Date(year, month, 1).getDay(),
        };
    }, [currentDate, t]);
    
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    return (
         <div className="p-6 bg-white dark:bg-[#161b22] rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">&lt;</button>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">{monthName} {year}</h3>
                <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center">
                {weekDays.map(day => <div key={day} className="font-bold text-sm text-gray-500 dark:text-gray-400">{day}</div>)}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`}></div>)}
                {Array.from({ length: daysInMonth }).map((_, day) => {
                    const dayNumber = day + 1;
                    const dateStr = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                    const isStudied = studyDays.has(dateStr);
                    const isToday = dateStr === todayStr;

                    let cellClasses = "w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-200";
                    if (isToday) {
                        cellClasses += " ring-2 ring-emerald-500";
                    }
                    if (isStudied) {
                        cellClasses += " bg-emerald-500 text-white font-bold";
                    } else {
                        cellClasses += " text-gray-700 dark:text-gray-300";
                    }
                    
                    return (
                        <div key={dayNumber} className={cellClasses}>
                            {dayNumber}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const StudyStreakTab: React.FC<StudyStreakTabProps> = ({ streakData }) => {
    const { t } = useLocale();
    const studyDaysSet = useMemo(() => new Set(streakData.studyDays), [streakData.studyDays]);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-200 text-center">{t('streakTitle')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    icon="🔥" 
                    label={t('currentStreak')} 
                    value={streakData.currentStreak}
                    unit={streakData.currentStreak === 1 ? t('streakDay') : t('streakDays')}
                />
                 <StatCard 
                    icon="🏆" 
                    label={t('longestStreak')} 
                    value={streakData.longestStreak}
                    unit={streakData.longestStreak === 1 ? t('streakDay') : t('streakDays')}
                />
                 <StatCard 
                    icon="🗓️" 
                    label={t('totalStudyDays')} 
                    value={streakData.studyDays.length}
                    unit={streakData.studyDays.length === 1 ? t('streakDay') : t('streakDays')}
                />
            </div>

            <Calendar studyDays={studyDaysSet} />

        </div>
    );
};

export default StudyStreakTab;
