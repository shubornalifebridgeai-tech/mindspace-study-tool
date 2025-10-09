import React, { useMemo } from 'react';
import type { PositionedNode, MindMapNode as MindMapNodeType } from '../types';
import { NODE_WIDTH, NODE_BASE_HEIGHT, wrapText } from './mindMapLayout';

interface MindMapNodeProps {
    node: PositionedNode;
    isSelected: boolean;
    isHighlighted: boolean;
    isDimmed: boolean;
    onSelect: (id: string) => void;
    onAdd: (parentId: string) => void;
    onRename: (id: string, oldConcept: string) => void;
    onDelete: (id: string) => void;
    onHover: (id: string | null) => void;
    onUpdateStyle: (id: string, style: Partial<Pick<MindMapNodeType, 'color' | 'textColor' | 'isBold' | 'isItalic'>>) => void;
    onDragStart: (e: React.MouseEvent, nodeId: string) => void;
    palette: { fill: string; text: string; }[];
}

const MindMapNode: React.FC<MindMapNodeProps> = React.memo(({ node, isSelected, onSelect, onAdd, onRename, onDelete, isHighlighted, isDimmed, onHover, onUpdateStyle, onDragStart, palette }) => {
    const lines = useMemo(() => wrapText(node.concept, NODE_WIDTH - 20), [node.concept]);
    const requiredHeight = Math.max(NODE_BASE_HEIGHT, lines.length * 16 + 24);

    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };
    
    const opacity = isDimmed ? 0.2 : 1;
    
    return (
        <g 
            transform={`translate(${node.x}, ${node.y})`} 
            onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
            onMouseDown={(e) => onDragStart(e, node.id)}
            onMouseEnter={() => onHover(node.id)}
            onMouseLeave={() => onHover(null)}
            className="cursor-pointer group/node transition-opacity duration-300"
            style={{ 
                opacity,
                transform: isHighlighted ? 'scale(1.05)' : 'scale(1)',
                transitionProperty: 'opacity, transform',
             }}
        >
            {/* Main node body */}
            <rect
                x={-NODE_WIDTH / 2}
                y={-requiredHeight / 2}
                width={NODE_WIDTH}
                height={requiredHeight}
                rx={requiredHeight / 2}
                className={`transition-all stroke-black/10 dark:stroke-white/10 ${node.color}`}
                strokeWidth={isSelected ? 2.5 : 1}
                stroke={isSelected ? '#10B981' : 'transparent'}
                style={{ filter: isHighlighted ? 'drop-shadow(0 6px 8px rgba(0,0,0,0.2))' : 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))', transition: 'all 300ms' }}
            />
            {/* The concept text */}
            <text
                textAnchor="middle"
                dominantBaseline="central"
                className={`${node.textColor} text-sm select-none transition-colors duration-300 ${node.isBold ? 'font-bold' : 'font-semibold'} ${node.isItalic ? 'italic' : ''}`}
                style={{ pointerEvents: 'none' }}
            >
                {lines.map((line, i) => (
                    <tspan key={i} x={0} y={i * 16 - (lines.length - 1) * 8}>
                        {line}
                    </tspan>
                ))}
            </text>

            {/* Editing controls */}
            {isSelected && (
                <g className="node-controls">
                    {/* Style controls (color, bold, italic) above the node */}
                    <foreignObject x={-NODE_WIDTH / 2} y={(-requiredHeight / 2) - 45} width={NODE_WIDTH} height={40}>
                        <div 
                            className="flex justify-center items-center gap-1 p-1 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-md"
                            onMouseDown={(e) => e.stopPropagation()} // Prevent drag from starting on controls
                            onClick={(e) => e.stopPropagation()}
                        >
                            {palette.map((color, i) => (
                                <button key={i} onClick={() => onUpdateStyle(node.id, { color: color.fill, textColor: color.text })} className={`w-5 h-5 rounded-full ${color.fill.split(' ')[0]} border border-slate-400/50`}></button>
                            ))}
                             <button onClick={() => onUpdateStyle(node.id, { isBold: !node.isBold })} className={`w-6 h-6 rounded font-bold ${node.isBold ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-600'}`}>B</button>
                            <button onClick={() => onUpdateStyle(node.id, { isItalic: !node.isItalic })} className={`w-6 h-6 rounded font-serif italic ${node.isItalic ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-600'}`}>I</button>
                        </div>
                    </foreignObject>

                    {/* Add Child Node Button (+) */}
                    <g transform={`translate(${NODE_WIDTH / 2}, 0)`} onClick={(e) => handleActionClick(e, () => onAdd(node.id))}>
                        <circle r="14" className="fill-green-500 hover:fill-green-600 transition-colors" style={{filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))'}} />
                        <text x="0" y="1" textAnchor="middle" dominantBaseline="middle" className="fill-white font-bold text-xl select-none">+</text>
                    </g>
                    
                    {/* Rename Node Button (Pencil Icon) */}
                    <g transform={`translate(0, ${requiredHeight / 2})`} onClick={(e) => handleActionClick(e, () => onRename(node.id, node.concept))}>
                        <circle r="14" className="fill-blue-500 hover:fill-blue-600 transition-colors" style={{filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))'}}/>
                        <path d="m13.29 7.29-4.58 4.58a.5.5 0 0 0 0 .71l.71.71a.5.5 0 0 0 .71 0l4.58-4.58a.5.5 0 0 0 0-.71l-.71-.71a.5.5 0 0 0-.71 0Z M10.5 9.5 9.5 10.5 M7 13h2v-2" stroke="white" strokeWidth="1.5" fill="none" transform="scale(0.8) translate(-12, -12)"/>
                    </g>

                    {/* Delete Node Button (X) */}
                    {!node.isRoot && (
                         <g transform={`translate(-${NODE_WIDTH / 2}, 0)`} onClick={(e) => handleActionClick(e, () => onDelete(node.id))}>
                            <circle r="14" className="fill-red-500 hover:fill-red-600 transition-colors" style={{filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))'}} />
                            <text x="0" y="1" textAnchor="middle" dominantBaseline="middle" className="fill-white font-bold text-lg select-none">×</text>
                        </g>
                    )}
                </g>
            )}
        </g>
    );
});

export default MindMapNode;