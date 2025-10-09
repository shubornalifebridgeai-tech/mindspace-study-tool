import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { translations, TranslationKey } from '../utils/translations';

type ValidLocale = keyof typeof translations;

interface LocaleContextType {
    locale: string;
    setLocale: (locale: string) => void;
    // FIX: Updated the function signature to accept an optional 'replacements' object for dynamic values in translations.
    t: (key: TranslationKey, replacements?: { [key: string]: string | number }) => string;
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

    // FIX: Updated the implementation of the translation function to handle placeholder replacements (e.g., "{score}").
    const t = (key: TranslationKey, replacements?: { [key: string]: string | number }): string => {
        const lang = locale as ValidLocale;
        let translation = (translations[lang] && translations[lang][key])
            ? translations[lang][key]
            // Fallback to English if the key is not found in the current language
            : translations.en[key] || key;
        
        if (replacements) {
            Object.keys(replacements).forEach(placeholder => {
                const regex = new RegExp(`\\{${placeholder}\\}`, 'g');
                translation = translation.replace(regex, String(replacements[placeholder]));
            });
        }

        return translation;
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