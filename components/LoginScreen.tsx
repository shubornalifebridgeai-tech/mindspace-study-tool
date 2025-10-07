
import React from 'react';
import { useLocale } from '../context/LocaleContext';

interface LoginScreenProps {
    onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const { t } = useLocale();

    return (
        <div className="flex items-center justify-center min-h-screen bg-emerald-50 dark:bg-[#0D1117]">
            <div className="text-center p-8 bg-white dark:bg-[#161b22] rounded-2xl shadow-2xl max-w-md w-full mx-4">
                <div className="flex justify-center mb-6">
                     <svg className="w-16 h-16 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18s-3.332.477-4.5 1.253"></path></svg>
                </div>
                <h1 className="text-3xl font-extrabold text-gray-800 dark:text-gray-200 mb-2">{t('appTitle')}</h1>
                <p className="text-gray-600 dark:text-gray-300 mb-8">{t('loginWelcome')}</p>
                
                <button
                    onClick={onLogin}
                    className="w-full flex items-center justify-center gap-3 bg-white dark:bg-[#21262d] text-gray-700 dark:text-gray-200 font-semibold py-3 px-4 rounded-lg border border-gray-300 dark:border-[#30363d] hover:bg-gray-100 dark:hover:bg-[#30363d] transition-all duration-300 shadow-sm"
                >
                    <svg className="w-5 h-5" viewBox="0 0 48 48">
                        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.462,44,30.038,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                    </svg>
                    {t('signInWithGoogle')}
                </button>
            </div>
        </div>
    );
};

export default LoginScreen;