
import React from 'react';
import type { Tab } from '../types';
import { TABS } from '../constants';
import { useLocale } from '../context/LocaleContext';
import Tooltip from './Tooltip';

interface TabsProps {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
}

const TabsComponent: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
    const { t } = useLocale();
    return (
        <nav className="bg-gray-100 dark:bg-[#161b22] border-b border-gray-300 dark:border-[#30363d] shadow-sm">
            <ul className="flex overflow-x-auto whitespace-nowrap px-2">
                {TABS.map((tab) => (
                    <li key={tab.id}>
                        <Tooltip text={t(tab.tooltipKey)}>
                             <button
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-3 flex-shrink-0 text-sm md:text-base font-semibold transition-all duration-200 ease-in-out border-b-4 focus:outline-none
                                    ${
                                        activeTab.id === tab.id
                                            ? 'border-emerald-500 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-[#0D1117]'
                                            : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#21262d]'
                                    }`
                                }
                            >
                                {t(tab.labelKey)}
                            </button>
                        </Tooltip>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default TabsComponent;