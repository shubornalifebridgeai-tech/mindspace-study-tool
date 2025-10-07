import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { StudyData, SavedNote, MindMapNode, Flashcard } from '../types';
import { useLocale } from '../context/LocaleContext';

interface SearchBarProps {
    studyData: StudyData | null;
    savedNotes: SavedNote[];
    onLoadNote: (noteId: string) => void;
}

interface SearchResult {
    type: 'current' | 'saved';
    title: string;
    context: string;
    noteId?: string;
}

// Debounce hook to prevent searching on every keystroke
function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

const searchInText = (text: string | undefined, query: string): boolean => {
    return !!text && text.toLowerCase().includes(query.toLowerCase());
}

const searchInMindMap = (nodes: MindMapNode[] | undefined, query: string): boolean => {
    if (!nodes) return false;
    for (const node of nodes) {
        if (searchInText(node.concept, query)) return true;
        if (node.subConcepts && searchInMindMap(node.subConcepts, query)) return true;
    }
    return false;
}

const searchInFlashcards = (flashcards: Flashcard[] | undefined, query: string): boolean => {
    if (!flashcards) return false;
    return flashcards.some(fc => searchInText(fc.question, query) || searchInText(fc.answer, query));
}

const SearchBar: React.FC<SearchBarProps> = ({ studyData, savedNotes, onLoadNote }) => {
    const { t } = useLocale();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const debouncedQuery = useDebounce(query, 300);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!debouncedQuery) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const newResults: SearchResult[] = [];

        // Search in current study data
        if (studyData) {
            if (searchInText(studyData.summary, debouncedQuery)) {
                newResults.push({ type: 'current', title: t('summaryTitle'), context: studyData.summary!.substring(0, 100) + '...' });
            }
             if (searchInText(studyData.keyInsight, debouncedQuery)) {
                newResults.push({ type: 'current', title: t('keyInsightTitle'), context: studyData.keyInsight!.substring(0, 100) + '...' });
            }
            if (searchInMindMap(studyData.mindMap, debouncedQuery)) {
                 newResults.push({ type: 'current', title: t('mindMapTitle'), context: `Found match for "${debouncedQuery}" in mind map.` });
            }
        }
        
        // Search in saved notes
        savedNotes.forEach(note => {
            if (searchInText(note.title, debouncedQuery) || searchInText(note.data.summary, debouncedQuery) || searchInText(note.data.keyInsight, debouncedQuery)) {
                 newResults.push({ type: 'saved', title: note.title, context: `Saved on ${new Date(note.createdAt).toLocaleDateString()}`, noteId: note.id });
            }
        });
        
        setResults(newResults);
        setIsOpen(newResults.length > 0);

    }, [debouncedQuery, studyData, savedNotes, t]);
    
    // Handle closing the results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLoadNote = (noteId: string | undefined) => {
        if (noteId) {
            onLoadNote(noteId);
            setQuery('');
            setIsOpen(false);
        }
    }
    
    const currentResults = results.filter(r => r.type === 'current');
    const savedResults = results.filter(r => r.type === 'saved');

    return (
        <div className="relative w-full max-w-lg" ref={searchRef}>
            <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query && results.length > 0 && setIsOpen(true)}
                    placeholder={t('searchPlaceholder')}
                    className="w-full bg-gray-100 dark:bg-[#21262d] text-gray-800 dark:text-gray-200 pl-10 pr-4 py-2 rounded-full border-2 border-transparent focus:border-emerald-500 focus:ring-0 focus:outline-none transition"
                />
            </div>
            {isOpen && (
                <div className="absolute mt-2 w-full bg-white dark:bg-[#161b22] rounded-lg shadow-2xl z-40 overflow-hidden border border-gray-200 dark:border-[#30363d]">
                    <div className="max-h-96 overflow-y-auto">
                        {currentResults.length > 0 && (
                             <div>
                                <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-[#21262d]">{t('searchResultsCurrent')}</h3>
                                <ul>
                                    {currentResults.map((result, index) => (
                                        <li key={`current-${index}`} className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#30363d] cursor-default">
                                            <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{result.title}</p>
                                            <p className="text-gray-600 dark:text-gray-300 text-xs truncate">{result.context}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {savedResults.length > 0 && (
                             <div>
                                <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-[#21262d]">{t('searchResultsSaved')}</h3>
                                <ul>
                                    {savedResults.map((result, index) => (
                                        <li key={`saved-${index}`} className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#30363d] cursor-pointer" onClick={() => handleLoadNote(result.noteId)}>
                                            <p className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">{result.title}</p>
                                            <p className="text-gray-600 dark:text-gray-300 text-xs truncate">{result.context}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                         {debouncedQuery && results.length === 0 && (
                            <p className="p-4 text-center text-sm text-gray-500">{t('searchNoResults')}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchBar;
