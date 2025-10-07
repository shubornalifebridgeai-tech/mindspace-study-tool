
import React from 'react';
import { useLocale } from '../context/LocaleContext';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
    const { t } = useLocale();
    if (!isOpen) return null;

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
                <h4 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-200">{title}</h4>
                <p className="text-gray-700 dark:text-gray-300 mb-6">{message}</p>
                <div className="flex justify-end space-x-4">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2 rounded-lg font-semibold bg-gray-200 dark:bg-[#30363d] hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                    >
                        {t('cancelBtn')}
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className="px-6 py-2 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700 transition"
                    >
                        {t('confirmBtn')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;