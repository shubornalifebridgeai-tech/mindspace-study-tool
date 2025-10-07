
import React, { useRef, useEffect } from 'react';
import { useLocale } from '../context/LocaleContext';

interface CameraModalProps {
    onClose: () => void;
    onCapture: (dataUrl: string) => void;
    onError: (message: string) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ onClose, onCapture, onError }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { t } = useLocale();

    useEffect(() => {
        let stream: MediaStream | null = null;
        
        const startCamera = async () => {
            try {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                } else {
                     onError(t('cameraError'));
                }
            } catch (err) {
                console.error("Camera access error:", err);
                onError(t('cameraError'));
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [t, onError]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current && videoRef.current.srcObject) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg');
                onCapture(dataUrl);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#161b22] p-4 rounded-xl shadow-2xl max-w-lg w-full">
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg bg-gray-900" />
                <canvas ref={canvasRef} className="hidden" />

                <div className="mt-4 flex justify-between gap-4">
                    <button onClick={onClose} className="w-full bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition">
                        {t('closeCamera')}
                    </button>
                    <button onClick={handleCapture} className="w-full bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 transition disabled:bg-gray-400">
                        {t('capture')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CameraModal;