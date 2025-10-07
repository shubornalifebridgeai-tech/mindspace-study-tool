
import React from 'react';
import { useLocale } from '../context/LocaleContext';

interface ErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    message: string | null;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, message }) => {
    const { t } = useLocale();
    if (!isOpen || !message) return null;

    return (
        <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-60 z-50 flex items-center justify-center p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-white dark:bg-[#161b22] p-6 rounded-xl shadow-2xl max-w-sm w-full transform transition-transform scale-100"
                onClick={(e) => e.stopPropagation()}
            >
                <h4 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">{t('errorModalTitle')}</h4>
                <p className="text-gray-700 dark:text-gray-300 mb-6">{message}</p>
                <div className="flex justify-end">
                     <button 
                        onClick={onClose} 
                        className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition"
                    >
                        {t('closeBtn')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ErrorModal;
