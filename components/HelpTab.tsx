
import React from 'react';
import { useLocale } from '../context/LocaleContext';

const HelpTab: React.FC = () => {
    const { t } = useLocale();

    return (
        <div className="max-w-3xl mx-auto space-y-8 p-4 bg-white dark:bg-[#161b22] rounded-xl shadow-lg animate-fade-in">
            <h2 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mb-4 text-center">
                {t('welcomeTitle')}
            </h2>
            
            <section className="p-4 bg-green-50 dark:bg-[#21262d] rounded-lg border-l-4 border-emerald-500 shadow-inner">
                <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-100">{t('helpHeader1')}</h3>
                <p className="text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: t('helpDesc1') }} />
            </section>
            
            <section className="p-4 bg-blue-50 dark:bg-[#21262d] rounded-lg border-l-4 border-blue-500 shadow-inner">
                <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-100">{t('helpHeader2')}</h3>
                <p className="text-gray-700 dark:text-gray-300">
                    {t('helpDesc2')}
                </p>
            </section>
            
            <section className="p-4 bg-yellow-50 dark:bg-[#21262d] rounded-lg border-l-4 border-yellow-500 shadow-inner">
                <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-100">{t('helpHeader3')}</h3>
                 <p className="text-gray-700 dark:text-gray-300">
                    {t('helpDesc3')}
                </p>
            </section>
        </div>
    );
};

export default HelpTab;