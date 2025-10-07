
import React, { useState, useEffect, useCallback } from 'react';
import { generateStudyTools, generateFollowUpAnswer } from './services/geminiService';
import type { StudyData, SavedNote, Tab, GenerationOptions, ChatMessage, User, MindMapNode } from './types';
import { TABS } from './constants';
import { useLocale } from './context/LocaleContext';

import Header from './components/Header';
import Tabs from './components/Tabs';
import HelpTab from './components/HelpTab';
import InputTab from './components/InputTab';
import NotesTab from './components/NotesTab';
import FlashcardsTab from './components/FlashcardsTab';
import QuizzesTab from './components/QuizzesTab';
import StudyBuddyTab from './components/StudyBuddyTab'; // New
import Tooltip from './components/Tooltip';
import ConfirmModal from './components/ConfirmModal';
import ErrorModal from './components/ErrorModal';
import LoginScreen from './components/LoginScreen';
import WelcomeModal from './components/WelcomeModal';
import HomeScreen from './components/HomeScreen';

const simpleUUID = () => `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const addIdsToMindMapNodes = (nodes: Omit<MindMapNode, 'id'>[]): MindMapNode[] => {
    return nodes.map(node => ({
        ...node,
        id: simpleUUID(),
        subConcepts: node.subConcepts ? addIdsToMindMapNodes(node.subConcepts) : [],
    }));
};

interface SavedTabProps {
    notes: SavedNote[];
    onLoad: (id: string) => void;
    onDelete: (id: string) => void;
}

const SavedTab: React.FC<SavedTabProps> = ({ notes, onLoad, onDelete }) => {
    const { t } = useLocale();

    if (notes.length === 0) {
        return (
            <div className="text-center p-8 bg-white dark:bg-[#161b22] rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">{t('savedNotesTitle')}</h3>
                <p className="text-gray-600 dark:text-gray-300">
                    {t('savedNotesEmpty')}
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{t('savedNotesHistory')}</h2>
            <div className="space-y-3">
                {notes.map(note => (
                    <div key={note.id} className="bg-white dark:bg-[#161b22] p-4 rounded-lg shadow-md flex justify-between items-center flex-wrap gap-2">
                        <div>
                            <p className="font-bold text-gray-800 dark:text-gray-200">{note.title}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('savedOn')}: {new Date(note.createdAt).toLocaleString()}
                            </p>
                        </div>
                        <div className="flex space-x-2 flex-shrink-0">
                            <Tooltip text={t('tooltip_load')}>
                                <button
                                    onClick={() => onLoad(note.id)}
                                    className="bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg transition"
                                >
                                    {t('loadBtn')}
                                </button>
                            </Tooltip>
                            <Tooltip text={t('tooltip_delete')}>
                                <button
                                    onClick={() => onDelete(note.id)}
                                    className="bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition"
                                >
                                    {t('deleteBtn')}
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const { t } = useLocale();
    const [user, setUser] = useState<User | null>(null);
    const [theme, setTheme] = useState<'light' | 'dark' | 'colorful'>(() => (localStorage.getItem('theme') as any) || 'dark');
    const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false);
    const [currentView, setCurrentView] = useState<'home' | 'study'>('home');

    const [studyData, setStudyData] = useState<StudyData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>(TABS[0]);
    const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
    const [notification, setNotification] = useState<string | null>(null);
    const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
    
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
    const [originalContext, setOriginalContext] = useState<string>('');

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('mindSpaceUser');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
            
            const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
            if (!hasSeenWelcome && storedUser) {
                setShowWelcomeModal(true);
            }
        } catch (e) {
            console.error("Failed to initialize from localStorage", e);
        }
    }, []);
    
    useEffect(() => {
        const doc = document.documentElement;
        doc.classList.remove('light', 'dark', 'colorful');
        doc.classList.add(theme);
        if (theme !== 'colorful') {
            document.body.classList.remove('theme-colorful');
        } else {
             document.body.classList.add('theme-colorful');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        try {
            const storedNotes = localStorage.getItem('studyArchitectNotes');
            if (storedNotes) setSavedNotes(JSON.parse(storedNotes));
        } catch (e) {
            console.error("Failed to load notes from localStorage", e);
            setError(t('errorLoadNotes'));
        }

        const hash = window.location.hash;
        if (hash.startsWith('#share=')) {
            try {
                const encodedData = hash.substring(7);
                const jsonString = decodeURIComponent(atob(encodedData));
                const sharedData: StudyData = JSON.parse(jsonString);
                setStudyData(sharedData);
                setChatHistory([]);
                setActiveTab(TABS[2]);
                setCurrentView('study');
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
                setNotification(t('notificationSharedNoteLoaded'));
            } catch (e) {
                console.error("Failed to parse shared data from URL", e);
                setError(t('errorParseShareLink'));
            }
        }
    }, [t]);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const handleLogin = () => {
        const mockUser: User = {
            name: 'Alex Doe',
            email: 'alex.doe@example.com',
            picture: `https://api.dicebear.com/8.x/initials/svg?seed=Alex%20Doe`,
        };
        localStorage.setItem('mindSpaceUser', JSON.stringify(mockUser));
        setUser(mockUser);

        const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
        if (!hasSeenWelcome) {
            setShowWelcomeModal(true);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('mindSpaceUser');
        setUser(null);
        setCurrentView('home');
    };

    const handleCloseWelcomeModal = () => {
        localStorage.setItem('hasSeenWelcome', 'true');
        setShowWelcomeModal(false);
    };

    const handleGenerate = async (inputText: string, options: GenerationOptions) => {
        if (!process.env.API_KEY) {
            setError(t('errorApiKey'));
            return;
        }
        if (inputText.trim().length < 50) {
            setError(t('errorInputTooShort'));
            return;
        }
        if (!options.generateSummary && !options.generateMindMap && !options.generateFlashcards) {
            setError(t('errorNoOptionsSelected'));
            return;
        }

        setIsLoading(true);
        setError(null);
        setStudyData(null);
        setChatHistory([]);
        setOriginalContext(inputText);

        try {
            const result = await generateStudyTools(inputText, options, t('geminiLocale'));
            if (result.mindMap) {
                result.mindMap = addIdsToMindMapNodes(result.mindMap);
            }
            setStudyData(result);
            setActiveTab(TABS.find(tab => tab.id === 'notes')!);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : t('errorGeneration'));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleFollowUp = async (question: string) => {
        if (!question.trim()) return;

        const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: question }];
        setChatHistory(newHistory);
        setIsChatLoading(true);

        try {
            const answer = await generateFollowUpAnswer(originalContext, newHistory, t('geminiLocale'));
            setChatHistory(prev => [...prev, { role: 'model', content: answer }]);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : t('errorGeneration'));
            setChatHistory(chatHistory);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleSaveNote = useCallback(() => {
        if (!studyData) return;

        const title = studyData.summary 
            ? studyData.summary.substring(0, 40) + '...'
            : `Note from ${new Date().toLocaleDateString()}`;

        const newNote: SavedNote = {
            id: new Date().toISOString(),
            title: title,
            createdAt: new Date().toISOString(),
            data: studyData,
        };

        setSavedNotes(prevNotes => {
            const updatedNotes = [newNote, ...prevNotes];
            localStorage.setItem('studyArchitectNotes', JSON.stringify(updatedNotes));
            return updatedNotes;
        });

        setNotification(t('notificationNoteSaved'));
    }, [studyData, t]);

    const handleShareNote = useCallback(async () => {
        if (!studyData?.summary) return;
        const shareText = `Summary:\n${studyData.summary}\n\nKey Insight:\n${studyData.keyInsight}`;
        try {
            if (navigator.share) {
                await navigator.share({ title: t('shareTitle'), text: shareText });
                setNotification(t('notificationNoteShared'));
            } else {
                await navigator.clipboard.writeText(shareText);
                setNotification(t('notificationNoteCopied'));
            }
        } catch (error) {
            console.error('Sharing failed:', error);
            if (error instanceof DOMException && error.name === 'AbortError') {
                 await navigator.clipboard.writeText(shareText);
                 setNotification(t('notificationNoteCopied'));
            }
        }
    }, [studyData, t]);

    const handleLoadNote = (noteId: string) => {
        const noteToLoad = savedNotes.find(n => n.id === noteId);
        if (noteToLoad) {
            const dataWithIds = { ...noteToLoad.data };
            if (dataWithIds.mindMap) {
                dataWithIds.mindMap = addIdsToMindMapNodes(dataWithIds.mindMap as any);
            }
            setStudyData(dataWithIds);
            setChatHistory([]);
            setActiveTab(TABS.find(tab => tab.id === 'notes')!);
            setCurrentView('study');
            setNotification(t('notificationNoteLoaded'));
        } else {
            setError(t('errorFindNode'));
        }
    };

    const handleDeleteNote = (noteId: string) => setNoteToDelete(noteId);
    
    const confirmDelete = () => {
        if (!noteToDelete) return;
        setSavedNotes(prevNotes => {
            const updatedNotes = prevNotes.filter(n => n.id !== noteToDelete);
            localStorage.setItem('studyArchitectNotes', JSON.stringify(updatedNotes));
            return updatedNotes;
        });
        setNotification(t('notificationNoteDeleted'));
        setNoteToDelete(null);
    };
    
    const handleMindMapChange = (newMindMapData: MindMapNode[]) => {
        setStudyData(prev => prev ? { ...prev, mindMap: newMindMapData } : null);
        setNotification('Mind map updated!');
    };

    const navigateToStudy = (tabId: Tab['id'] = 'input') => {
        setActiveTab(TABS.find(t => t.id === tabId) || TABS[1]);
        setCurrentView('study');
    };

    const renderTabContent = () => {
        switch (activeTab.id) {
            case 'help': return <HelpTab />;
            case 'input': return <InputTab onGenerate={handleGenerate} isLoading={isLoading} onError={setError} />;
            case 'notes': return <NotesTab studyData={studyData} onSave={handleSaveNote} onShare={handleShareNote} setNotification={setNotification} onFollowUp={handleFollowUp} chatHistory={chatHistory} isChatLoading={isChatLoading} onMindMapChange={handleMindMapChange} />;
            case 'flashcards': return <FlashcardsTab flashcards={studyData?.flashcards} />;
            case 'quizzes': return <QuizzesTab studyData={studyData} />;
            case 'studyBuddy': return <StudyBuddyTab studyData={studyData} />;
            case 'saved': return <SavedTab notes={savedNotes} onLoad={handleLoadNote} onDelete={handleDeleteNote} />;
            default: return <HelpTab />;
        }
    };
    
    if (!user) {
        return <LoginScreen onLogin={handleLogin} />;
    }
    
    if (currentView === 'home') {
        return <HomeScreen user={user} theme={theme} setTheme={setTheme} onNavigate={navigateToStudy} />;
    }

    return (
        <div className="min-h-screen bg-emerald-50 dark:bg-[#0D1117] text-gray-800 dark:text-gray-200">
            <Header 
                user={user} 
                onLogout={handleLogout}
                studyData={studyData}
                savedNotes={savedNotes}
                onLoadNote={handleLoadNote}
                onGoHome={() => setCurrentView('home')}
            />
             <div className="bg-emerald-100 dark:bg-[#161b22] p-2 text-center text-xs text-emerald-800 dark:text-emerald-200 no-print">
                <span>{t('appWelcomeBanner')}</span>
            </div>
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="p-4 md:p-6 lg:p-8">
                {renderTabContent()}
            </main>

            <WelcomeModal isOpen={showWelcomeModal} onClose={handleCloseWelcomeModal} />
            <ConfirmModal isOpen={!!noteToDelete} onClose={() => setNoteToDelete(null)} onConfirm={confirmDelete} title={t('confirmDeleteTitle')} message={t('confirmDeleteMessage')} />

            <ErrorModal isOpen={!!error} onClose={() => setError(null)} message={error} />
            
            {notification && (
                <div className="fixed bottom-4 right-4 bg-green-600 dark:bg-emerald-700 text-white py-2 px-4 rounded-lg shadow-lg z-50 animate-fade-in-out">
                    {notification}
                </div>
            )}
        </div>
    );
};

export default App;