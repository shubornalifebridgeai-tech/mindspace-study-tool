import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { useLocale } from '../context/LocaleContext';
import { extractTextFromImage } from '../services/geminiService';
import ImageUploader from './ImageUploader';
import CameraModal from './CameraModal';
import Tooltip from './Tooltip';
import PdfUploader from './PdfUploader';
import type { GenerationOptions } from '../types';

interface InputTabProps {
    onGenerate: (text: string, options: GenerationOptions) => void;
    isLoading: boolean;
    onError: (message: string) => void;
}

type InputMode = 'text' | 'image' | 'pdf';

const InputTab: React.FC<InputTabProps> = ({ onGenerate, isLoading, onError }) => {
    const [text, setText] = useState<string>('');
    const [inputMode, setInputMode] = useState<InputMode>('text');
    const [isFileProcessing, setIsFileProcessing] = useState<boolean>(false);
    const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
    const { t } = useLocale();

    const [generationOptions, setGenerationOptions] = useState<GenerationOptions>({
        generateSummary: true,
        generateMindMap: true,
        generateFlashcards: true,
    });

    const handleOptionChange = (option: keyof GenerationOptions) => {
        setGenerationOptions(prev => ({ ...prev, [option]: !prev[option] }));
    };

    const handleSubmit = () => {
        onGenerate(text, generationOptions);
    };

    const handleImageUpload = async (file: File) => {
        setIsFileProcessing(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Data = (reader.result as string).split(',')[1];
                const extractedText = await extractTextFromImage({ data: base64Data, mimeType: file.type });
                setText(prevText => prevText ? `${prevText}\n\n${extractedText}` : extractedText);
                setInputMode('text');
            };
            reader.readAsDataURL(file);
        } catch (err) {
            onError(err instanceof Error ? err.message : t('errorImageUpload'));
        } finally {
            setIsFileProcessing(false);
        }
    };
    
    const handlePhotoCapture = async (dataUrl: string) => {
        setIsFileProcessing(true);
        setIsCameraOpen(false);
        try {
            const base64Data = dataUrl.split(',')[1];
            const extractedText = await extractTextFromImage({ data: base64Data, mimeType: 'image/jpeg' });
            setText(prevText => prevText ? `${prevText}\n\n${extractedText}` : extractedText);
            setInputMode('text');
        } catch (err) {
             onError(err instanceof Error ? err.message : t('errorImageUpload'));
        } finally {
            setIsFileProcessing(false);
        }
    };

    const handlePdfExtracted = (extractedText: string) => {
        setText(prevText => prevText ? `${prevText}\n\n${extractedText}` : extractedText);
        setInputMode('text');
    };


    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex bg-gray-200 dark:bg-[#21262d] rounded-lg p-1">
                <Tooltip text={t('tooltip_pasteText')}>
                    <button 
                        onClick={() => setInputMode('text')}
                        className={`w-1/3 p-2 rounded-md font-semibold transition ${inputMode === 'text' ? 'bg-white dark:bg-[#161b22] text-emerald-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                        {t('pasteText')}
                    </button>
                </Tooltip>
                <Tooltip text={t('tooltip_uploadImage')}>
                    <button 
                        onClick={() => setInputMode('image')}
                        className={`w-1/3 p-2 rounded-md font-semibold transition ${inputMode === 'image' ? 'bg-white dark:bg-[#161b22] text-emerald-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                         {t('uploadImage')}
                    </button>
                </Tooltip>
                 <Tooltip text={t('tooltip_uploadPdf')}>
                    <button 
                        onClick={() => setInputMode('pdf')}
                        className={`w-1/3 p-2 rounded-md font-semibold transition ${inputMode === 'pdf' ? 'bg-white dark:bg-[#161b22] text-emerald-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                         {t('uploadPdf')}
                    </button>
                </Tooltip>
            </div>

            {inputMode === 'text' && (
                 <>
                    <label htmlFor="input-text" className="block text-lg font-medium text-gray-700 dark:text-gray-200">
                        {t('inputLabel')}
                    </label>
                    <textarea
                        id="input-text"
                        rows={15}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        disabled={isLoading}
                        className="w-full p-6 border-2 border-gray-300 dark:border-[#30363d] focus:border-emerald-500 focus:ring-emerald-500 rounded-xl shadow-md resize-y dark:bg-[#161b22] dark:text-gray-200 text-base transition duration-300 disabled:opacity-60"
                        placeholder={t('inputPlaceholder')}
                    />
                </>
            )}
            {inputMode === 'image' && (
                <ImageUploader 
                    onImageUpload={handleImageUpload} 
                    onTakePhoto={() => setIsCameraOpen(true)}
                    isLoading={isFileProcessing} 
                />
            )}
            {inputMode === 'pdf' && (
                <PdfUploader
                    onPdfExtracted={handlePdfExtracted}
                    onError={onError}
                    setIsLoading={setIsFileProcessing}
                    isLoading={isFileProcessing}
                />
            )}

            <div className="p-4 bg-gray-100 dark:bg-[#161b22] rounded-lg">
                <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">{t('generationOptionsTitle')}</h4>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {Object.keys(generationOptions).map((key) => (
                        <label key={key} className="inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                checked={generationOptions[key as keyof GenerationOptions]}
                                onChange={() => handleOptionChange(key as keyof GenerationOptions)}
                            />
                            <span className="ml-2 text-gray-700 dark:text-gray-300">{t(key as any)}</span>
                        </label>
                    ))}
                </div>
            </div>
           
            <Tooltip text={t('tooltip_generate')}>
                <button
                    onClick={handleSubmit}
                    disabled={isLoading || !text || isFileProcessing}
                    className={`w-full text-white px-6 py-4 rounded-xl font-extrabold text-lg shadow-xl transition active:scale-95 disabled:cursor-not-allowed flex items-center justify-center space-x-3 ${
                        isLoading ? 'generating-animation' : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800'
                    }`}
                >
                    {(isLoading || isFileProcessing) && <LoadingSpinner />}
                    <span>{isLoading ? t('generating') : isFileProcessing ? t('processingFile') : t('generateBtn')}</span>
                </button>
            </Tooltip>

            {isCameraOpen && (
                <CameraModal
                    onClose={() => setIsCameraOpen(false)}
                    onCapture={handlePhotoCapture}
                    onError={onError}
                />
            )}
        </div>
    );
};

export default InputTab;