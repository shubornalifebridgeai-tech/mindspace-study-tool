
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useLocale } from '../context/LocaleContext';
import LoadingSpinner from './LoadingSpinner';
import Tooltip from './Tooltip';

interface ImageUploaderProps {
    onImageUpload: (file: File) => void;
    onTakePhoto: () => void;
    isLoading: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, onTakePhoto, isLoading }) => {
    const { t } = useLocale();
    const [preview, setPreview] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles && acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            const previewUrl = URL.createObjectURL(file);
            setPreview(previewUrl);
            onImageUpload(file);
        }
    }, [onImageUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.webp'] },
        multiple: false
    });

    return (
        <div className="space-y-4">
            <Tooltip text={t('tooltip_uploadArea')}>
                <div
                    {...getRootProps()}
                    className={`p-10 border-4 border-dashed rounded-xl text-center cursor-pointer transition-colors
                        ${isDragActive ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/50' : 'border-gray-300 dark:border-[#30363d] hover:border-emerald-400'}`}
                >
                    <input {...getInputProps()} />
                    <p className="text-gray-500 dark:text-gray-400">{t('imageUploadPrompt')}</p>
                </div>
            </Tooltip>

            <div className="text-center">
                <span className="text-gray-500 dark:text-gray-400 font-semibold">OR</span>
            </div>

            <Tooltip text={t('tooltip_takePhoto')}>
                <button
                    onClick={onTakePhoto}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-xl hover:bg-blue-700 transition active:scale-95 flex items-center justify-center gap-2"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t('takePhoto')}
                </button>
            </Tooltip>
            
            {isLoading && (
                <div className="mt-4 flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-[#161b22] rounded-lg">
                    {preview && <img src={preview} alt="Preview" className="max-h-40 rounded-lg mb-4" />}
                    <LoadingSpinner />
                    <p className="text-emerald-600 dark:text-emerald-400 mt-2 font-semibold">{t('extractingText')}</p>
                </div>
            )}
        </div>
    );
};

export default ImageUploader;