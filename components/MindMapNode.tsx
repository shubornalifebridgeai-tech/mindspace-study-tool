import React, { useMemo } from 'react';
import type { PositionedNode } from '../utils/mindMapLayout';
import { NODE_WIDTH, NODE_BASE_HEIGHT, wrapText } from '../utils/mindMapLayout';

interface MindMapNodeProps {
    node: PositionedNode;
    isSelected: boolean;
    isHighlighted: boolean;
    isAnyNodeHovered: boolean;
    isDimmed: boolean; // New prop for focus mode
    onSelect: (id: string) => void;
    onAdd: (parentId: string) => void;
    onRename: (id: string, oldConcept: string) => void;
    onDelete: (id: string) => void;
    onHover: (id: string | null) => void;
}

// The MindMapNode component renders a single concept bubble.
// When selected, it displays controls for editing the mind map.
const MindMapNode: React.FC<MindMapNodeProps> = React.memo(({ node, isSelected, onSelect, onAdd, onRename, onDelete, isHighlighted, isAnyNodeHovered, isDimmed, onHover }) => {
    // Memoize text wrapping to avoid re-calculation on every render
    const lines = useMemo(() => wrapText(node.concept, NODE_WIDTH - 20), [node.concept]);
    const requiredHeight = Math.max(NODE_BASE_HEIGHT, lines.length * 16 + 24);

    // Stop event propagation to prevent the main SVG canvas from deselection when an action is clicked.
    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };
    
    // Determine opacity based on hover and new focus (dimmed) states
    const opacity = isDimmed ? 0.2 : (isAnyNodeHovered ? (isHighlighted ? 1 : 0.3) : 1);
    
    return (
        <g 
            transform={`translate(${node.x}, ${node.y})`} 
            onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
            onMouseEnter={() => onHover(node.id)}
            onMouseLeave={() => onHover(null)}
            className="cursor-pointer group/node transition-all duration-300"
            style={{ 
                opacity,
                transition: 'opacity 300ms, transform 300ms',
                transform: isHighlighted ? 'scale(1.05)' : 'scale(1)',
             }}
        >
            {/* Main node body with a subtle shadow effect */}
            <rect
                x={-NODE_WIDTH / 2}
                y={-requiredHeight / 2}
                width={NODE_WIDTH}
                height={requiredHeight}
                rx={requiredHeight / 2} // Make it pill-shaped
                className={`transition-all stroke-black/10 dark:stroke-white/10 ${node.color}`}
                strokeWidth={isSelected ? 2.5 : 1}
                stroke={isSelected ? '#10B981' : 'currentColor'}
                style={{ filter: isHighlighted ? 'drop-shadow(0 6px 8px rgba(0,0,0,0.2))' : 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))', transition: 'all 300ms' }}
            />
            {/* The concept text, centered and wrapped */}
            <text
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-gray-900 dark:fill-gray-100 font-semibold text-sm select-none"
                style={{ pointerEvents: 'none' }}
            >
                {lines.map((line, i) => (
                    <tspan key={i} x={0} y={i * 16 - (lines.length - 1) * 8}>
                        {line}
                    </tspan>
                ))}
            </text>

            {/* Editing controls are only visible when the node is selected */}
            {isSelected && (
                <g className="node-controls">
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

                    {/* Delete Node Button (X), not shown for the root node */}
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
