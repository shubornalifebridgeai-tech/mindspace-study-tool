import React from 'react';
import type { MindMapNode as MindMapNodeType } from '../types';

interface MindMapOutlineProps {
    data: MindMapNodeType[];
}

const renderNode = (node: MindMapNodeType, level: number) => {
    const isRoot = level === 0;
    
    return (
        <li key={node.id} className={`${!isRoot ? 'ml-6 mt-2' : ''}`}>
            <span className={`font-semibold ${isRoot ? 'text-lg text-emerald-600 dark:text-emerald-400' : 'text-gray-800 dark:text-gray-200'}`}>
                {node.concept}
            </span>
            {node.subConcepts && node.subConcepts.length > 0 && (
                <ul className="list-disc pl-5 mt-1 border-l-2 border-gray-200 dark:border-gray-700">
                    {node.subConcepts.map(child => renderNode(child, level + 1))}
                </ul>
            )}
        </li>
    );
};

const MindMapOutline: React.FC<MindMapOutlineProps> = ({ data }) => {
    return (
        <div className="p-4 bg-gray-50 dark:bg-[#0D1117] rounded-lg h-[600px] overflow-y-auto">
            <ul>
                {data.map(node => renderNode(node, 0))}
            </ul>
        </div>
    );
};

export default MindMapOutline;