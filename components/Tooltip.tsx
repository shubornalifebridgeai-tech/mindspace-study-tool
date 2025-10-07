import React from 'react';

interface TooltipProps {
    text: string;
    children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
    if (!text) {
        return <>{children}</>;
    }

    return (
        <div className="relative group/tooltip">
            {children}
            <div 
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 text-xs text-white bg-gray-900 dark:bg-black rounded-md shadow-lg scale-0 group-hover/tooltip:scale-100 transition-transform duration-200 pointer-events-none z-30 origin-bottom" 
                role="tooltip"
            >
                {text}
            </div>
        </div>
    );
};

export default Tooltip;