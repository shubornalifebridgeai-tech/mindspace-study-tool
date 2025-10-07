
import React from 'react';
import { useLocale } from '../context/LocaleContext';

interface WelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
    const { t } = useLocale();
    if (!isOpen) return null;

    const features = [
        { icon: '✨', text: t('welcomeModalFeature1') },
        { icon: '🧠', text: t('welcomeModalFeature2') },
        { icon: '🃏', text: t('welcomeModalFeature3') },
    ];

    return (
        <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in"
            aria-modal="true"
            role="dialog"
        >
            <div className="bg-white dark:bg-[#161b22] p-8 rounded-2xl shadow-2xl max-w-md w-full transform transition-transform scale-100 animate-slide-up">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 mb-4">
                         <svg className="w-10 h-10 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18s-3.332.477-4.5 1.253"></path></svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-2">{t('welcomeModalTitle')}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{t('welcomeModalDesc')}</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                    {features.map((feature, index) => (
                         <li key={index} className="flex items-start">
                            <span className="text-2xl mr-3">{feature.icon}</span>
                            <span className="text-gray-700 dark:text-gray-200 text-left">{feature.text}</span>
                        </li>
                    ))}
                </ul>
                
                <button
                    onClick={onClose}
                    className="w-full bg-emerald-600 text-white px-6 py-3 rounded-xl font-extrabold text-lg shadow-xl hover:bg-emerald-700 transition active:scale-95"
                >
                    {t('welcomeModalCTA')}
                </button>
            </div>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
                @keyframes slide-up {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up {
                    animation: slide-up 0.4s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default WelcomeModal;