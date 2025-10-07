import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useLocale } from '../context/LocaleContext';
import LoadingSpinner from './LoadingSpinner';

declare const pdfjsLib: any;

interface PdfUploaderProps {
    onPdfExtracted: (text: string) => void;
    onError: (message: string) => void;
    setIsLoading: (isLoading: boolean) => void;
    isLoading: boolean;
}

const PdfUploader: React.FC<PdfUploaderProps> = ({ onPdfExtracted, onError, setIsLoading, isLoading }) => {
    const { t } = useLocale();

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (!acceptedFiles || acceptedFiles.length === 0) return;
        
        const file = acceptedFiles[0];
        setIsLoading(true);
        
        try {
            if (typeof pdfjsLib === 'undefined') {
                throw new Error("PDF library is not loaded.");
            }
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.min.mjs`;

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            const numPages = pdf.numPages;
            let fullText = '';

            for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += pageText + '\n\n';
            }
            onPdfExtracted(fullText.trim());

        } catch (error) {
            console.error('Error processing PDF:', error);
            onError(t('errorPdfProcessing'));
        } finally {
            setIsLoading(false);
        }
    }, [onPdfExtracted, onError, setIsLoading, t]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false,
        disabled: isLoading,
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-10 border-4 border-dashed border-gray-300 dark:border-[#30363d] rounded-xl bg-gray-100 dark:bg-[#161b22]">
                <LoadingSpinner />
                <p className="text-emerald-600 dark:text-emerald-400 mt-2 font-semibold">{t('pdfExtractingText')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={`p-10 border-4 border-dashed rounded-xl text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/50' : 'border-gray-300 dark:border-[#30363d] hover:border-emerald-400'}`}
            >
                <input {...getInputProps()} />
                <p className="text-gray-500 dark:text-gray-400">{t('pdfUploadPrompt')}</p>
            </div>
        </div>
    );
};

export default PdfUploader;