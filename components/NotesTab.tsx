import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { StudyData, ChatMessage, MindMapNode } from '../types';
import VisualMindMap from './VisualMindMap';
import MindMapOutline from './MindMapOutline';
import { useLocale } from '../context/LocaleContext';
import Tooltip from './Tooltip';
import { exportAsMarkdown } from '../utils/export';
import LoadingSpinner from './LoadingSpinner';

interface NotesTabProps {
    studyData: StudyData | null;
    onSave: () => void;
    onShare: () => void;
    setNotification: (message: string) => void;
    onFollowUp: (question: string) => void;
    chatHistory: ChatMessage[];
    isChatLoading: boolean;
    onMindMapChange: (newMindMapData: MindMapNode[]) => void;
    highlightedSentences: string[];
}

const NotesTab: React.FC<NotesTabProps> = ({ studyData, onSave, onShare, setNotification, onFollowUp, chatHistory, isChatLoading, onMindMapChange, highlightedSentences }) => {
    const { t } = useLocale();
    const [followUpQuery, setFollowUpQuery] = useState('');
    const [mindMapView, setMindMapView] = useState<'visual' | 'outline'>('visual');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isChatLoading]);

    const highlightedSummaryContent = useMemo(() => {
        if (!studyData?.summary) return null;
        const summary = studyData.summary;
        const highlights = highlightedSentences;

        if (!highlights || highlights.length === 0) {
            return <>{summary}</>;
        }

        const escapeRegExp = (string: string) => {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        };

        const sanitizedHighlights = highlights.filter(h => h && h.trim() !== '');
        if (sanitizedHighlights.length === 0) {
          return <>{summary}</>;
        }

        const regex = new RegExp(`(${sanitizedHighlights.map(escapeRegExp).join('|')})`, 'g');
        const parts = summary.split(regex);

        return (
            <>
                {parts.map((part, index) => {
                    const isHighlight = sanitizedHighlights.includes(part);
                    return isHighlight ? (
                        <mark key={index} className="bg-yellow-300 dark:bg-yellow-600/70 rounded px-1 py-0.5 transition-all duration-300 ease-in-out">
                            {part}
                        </mark>
                    ) : (
                        <React.Fragment key={index}>{part}</React.Fragment>
                    );
                })}
            </>
        );
    }, [studyData?.summary, highlightedSentences]);

    const handleCopyShareLink = () => {
        if (!studyData) return;
        try {
            const jsonString = JSON.stringify(studyData);
            const encodedData = btoa(encodeURIComponent(jsonString));
            const url = `${window.location.origin}${window.location.pathname}#share=${encodedData}`;
            navigator.clipboard.writeText(url);
            setNotification(t('notificationLinkCopied'));
        } catch (error) {
            console.error('Failed to create share link:', error);
        }
    };

    const handleExportPdf = () => {
        window.print();
    };
    
    const handleFollowUpSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onFollowUp(followUpQuery);
        setFollowUpQuery('');
    };

    if (!studyData || Object.keys(studyData).length === 0) {
        return (
            <div className="text-center p-8 bg-white dark:bg-[#161b22] rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">{t('notesEmptyTitle')}</h3>
                <p className="text-gray-600 dark:text-gray-300">
                    {t('notesEmptyDescription')}
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div id="notes-content" className="space-y-8">
                {studyData.summary && (
                    <div>
                        <h3 className="text-2xl font-bold mb-3 text-gray-800 dark:text-gray-200">{t('summaryTitle')}</h3>
                        <div className="p-4 border border-gray-300 dark:border-[#30363d] rounded-lg bg-gray-50 dark:bg-[#21262d] text-gray-700 dark:text-gray-200 whitespace-pre-wrap printable-area">
                            {highlightedSummaryContent}
                        </div>
                        {studyData.keyInsight && (
                             <div className="mt-4 p-4 border dark:border-yellow-500/20 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-gray-700 dark:text-yellow-200 italic printable-area">
                                <strong>{t('keyInsightTitle')}:</strong> {studyData.keyInsight}
                            </div>
                        )}
                    </div>
                )}

                {studyData.mindMap && studyData.mindMap.length > 0 && (
                    <div className="p-4 sm:p-6 bg-white dark:bg-[#161b22] rounded-xl shadow-lg printable-area">
                        <div className="flex justify-between items-center mb-4 no-print">
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{t('mindMapTitle')}</h3>
                            <div className="flex bg-gray-200 dark:bg-[#21262d] rounded-lg p-1">
                                <Tooltip text={t('tooltip_view_visual')}>
                                    <button
                                        onClick={() => setMindMapView('visual')}
                                        className={`px-3 py-1 text-sm font-semibold rounded-md transition ${mindMapView === 'visual' ? 'bg-white dark:bg-[#161b22] text-emerald-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}
                                    >
                                        {t('mindMapViewVisual')}
                                    </button>
                                </Tooltip>
                                <Tooltip text={t('tooltip_view_outline')}>
                                    <button
                                        onClick={() => setMindMapView('outline')}
                                        className={`px-3 py-1 text-sm font-semibold rounded-md transition ${mindMapView === 'outline' ? 'bg-white dark:bg-[#161b22] text-emerald-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}
                                    >
                                        {t('mindMapViewOutline')}
                                    </button>
                                </Tooltip>
                            </div>
                        </div>

                        {mindMapView === 'visual' ? (
                            <VisualMindMap mindMapData={studyData.mindMap} onUpdate={onMindMapChange} />
                        ) : (
                            <MindMapOutline data={studyData.mindMap} />
                        )}
                    </div>
                )}
            </div>
            
            {(chatHistory.length > 0 || studyData) && (
                 <div className="p-4 sm:p-6 bg-white dark:bg-[#161b22] rounded-xl shadow-lg no-print">
                    <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">{t('followUpTitle')}</h3>
                    <div className="max-h-96 overflow-y-auto pr-2 space-y-4 mb-4">
                        {chatHistory.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xl px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-emerald-600 dark:bg-emerald-700 text-white' : 'bg-gray-200 dark:bg-[#21262d] text-gray-800 dark:text-gray-100'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isChatLoading && (
                            <div className="flex justify-start">
                                <div className="max-w-xl px-4 py-2 rounded-2xl bg-gray-200 dark:bg-[#21262d] flex items-center gap-2">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75"></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></div>
                                </div>
                            </div>
                        )}
                         <div ref={chatEndRef} />
                    </div>
                     <form onSubmit={handleFollowUpSubmit} className="relative">
                        <input
                            type="text"
                            value={followUpQuery}
                            onChange={(e) => setFollowUpQuery(e.target.value)}
                            placeholder={t('followUpPlaceholder')}
                            disabled={isChatLoading}
                            className="w-full pl-4 pr-12 py-3 border-2 border-gray-300 dark:border-[#30363d] focus:border-emerald-500 focus:ring-emerald-500 rounded-full shadow-md dark:bg-[#21262d] dark:text-gray-200 text-base transition duration-300"
                        />
                        <button type="submit" disabled={isChatLoading || !followUpQuery} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-400 disabled:dark:bg-gray-600 disabled:cursor-not-allowed transition">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </form>
                 </div>
            )}

            <div className="p-4 sm:p-6 bg-white dark:bg-[#161b22] rounded-xl shadow-lg no-print">
                <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">{t('actionsTitle')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Tooltip text={t('tooltip_save')}>
                        <button onClick={onSave} className="w-full bg-blue-600 dark:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition active:scale-95 flex items-center justify-center gap-2">
                            {t('saveBtn')}
                        </button>
                    </Tooltip>
                    <Tooltip text={t('tooltip_share')}>
                        <button onClick={onShare} disabled={!studyData.summary} className="w-full bg-emerald-600 dark:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition active:scale-95 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:dark:bg-gray-600">
                            {t('shareBtn')}
                        </button>
                    </Tooltip>
                     <Tooltip text={t('tooltip_copyLink')}>
                        <button onClick={handleCopyShareLink} className="w-full bg-purple-600 dark:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition active:scale-95 flex items-center justify-center gap-2">
                           {t('copyLinkBtn')}
                        </button>
                    </Tooltip>
                </div>
                <div className="mt-6">
                     <h4 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-200">{t('exportTitle')}</h4>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Tooltip text={t('tooltip_exportMarkdown')}>
                            <button onClick={() => exportAsMarkdown(studyData)} className="w-full bg-gray-700 dark:bg-gray-600 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-gray-800 dark:hover:bg-gray-700 transition active:scale-95">
                                {t('exportMarkdownBtn')}
                            </button>
                        </Tooltip>
                        <Tooltip text={t('tooltip_exportPdf')}>
                             <button onClick={handleExportPdf} className="w-full bg-red-600 dark:bg-red-700 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-red-700 dark:hover:bg-red-600 transition active:scale-95">
                                {t('exportPdfBtn')}
                            </button>
                        </Tooltip>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(NotesTab);