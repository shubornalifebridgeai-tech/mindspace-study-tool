import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { translations, TranslationKey } from '../utils/translations';

type ValidLocale = keyof typeof translations;

interface LocaleContextType {
    locale: string;
    setLocale: (locale: string) => void;
    t: (key: TranslationKey) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export const LocaleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [locale, setLocaleState] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('locale') || 'en';
        }
        return 'en';
    });

    useEffect(() => {
        localStorage.setItem('locale', locale);
    }, [locale]);

    const setLocale = (newLocale: string) => {
        setLocaleState(newLocale);
    };

    const t = (key: TranslationKey): string => {
        const lang = locale as ValidLocale;
        if (translations[lang] && translations[lang][key]) {
            return translations[lang][key];
        }
        // Fallback to English if the key is not found in the current language
        return translations.en[key] || key;
    };

    return (
        <LocaleContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </LocaleContext.Provider>
    );
};

export const useLocale = (): LocaleContextType => {
    const context = useContext(LocaleContext);
    if (context === undefined) {
        throw new Error('useLocale must be used within a LocaleProvider');
    }
    return context;
};