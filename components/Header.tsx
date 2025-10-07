
import React, { useState, useRef, useEffect } from 'react';
import { useLocale } from '../context/LocaleContext';
import Tooltip from './Tooltip';
import SearchBar from './SearchBar';
import type { User, StudyData, SavedNote } from '../types';

interface HeaderProps {
    user: User;
    onLogout: () => void;
    studyData: StudyData | null;
    savedNotes: SavedNote[];
    onLoadNote: (noteId: string) => void;
    onGoHome: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, studyData, savedNotes, onLoadNote, onGoHome }) => {
    const { t, setLocale, locale } = useLocale();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => setLocale(e.target.value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="bg-white dark:bg-[#161b22] shadow-md p-4 flex justify-between items-center sticky top-0 z-20 gap-4">
            <button onClick={onGoHome} className="flex items-center flex-shrink-0 cursor-pointer" aria-label={t('tooltip_goHome')}>
                <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18s-3.332.477-4.5 1.253"></path></svg>
                <h1 className="text-xl md:text-2xl font-extrabold text-gray-800 dark:text-gray-200 hidden sm:block">{t('appTitle')}</h1>
            </button>

            <div className="flex-1 flex justify-center px-4">
                <SearchBar 
                    studyData={studyData}
                    savedNotes={savedNotes}
                    onLoadNote={onLoadNote}
                />
            </div>
            
            <div className="flex items-center space-x-3 flex-shrink-0">
                <Tooltip text={t('tooltip_changeLanguage')}>
                    <select id="language-select" value={locale} onChange={handleLocaleChange} className="p-2 border border-gray-300 dark:border-[#30363d] rounded-lg dark:bg-[#21262d] dark:text-gray-200 text-sm focus:ring-emerald-500 focus:border-emerald-500">
                        <option value="en">English</option>
                        <option value="bn">বাংলা</option>
                        <option value="es">Español</option>
                        <option value="ja">日本語</option>
                        <option value="ko">한국어</option>
                    </select>
                </Tooltip>
                <div className="relative" ref={menuRef}>
                    <Tooltip text={t('tooltip_userMenu')}>
                        <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
                            <img src={user.picture} alt="User" className="w-full h-full object-cover" />
                        </button>
                    </Tooltip>
                    {isUserMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#161b22] rounded-md shadow-lg py-1 z-30 ring-1 ring-black dark:ring-[#30363d] ring-opacity-5">
                            <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b dark:border-[#30363d]">
                                <p className="font-semibold">{user.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                            </div>
                            <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#21262d]">
                                {t('logoutBtn')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;