import type { MindMapNode } from '../types';

// --- Constants for Layout and Styling ---
export const NODE_WIDTH = 150;
export const NODE_BASE_HEIGHT = 50;

// Defines Tailwind class strings for node colors, enabling automatic dark mode switching with a "pro" feel.
export const ROOT_COLOR_CLASSES = 'fill-slate-200 dark:fill-slate-800';
export const LEVEL_2_PLUS_COLOR_CLASSES = 'fill-slate-100 dark:fill-slate-700';
export const COLOR_CLASSES = [
    'fill-yellow-200 dark:fill-yellow-800/60',
    'fill-sky-200 dark:fill-sky-800/60',
    'fill-emerald-200 dark:fill-emerald-800/60',
    'fill-red-200 dark:fill-red-800/60',
    'fill-violet-200 dark:fill-violet-800/60',
    'fill-pink-200 dark:fill-pink-800/60',
];

// --- Type Definitions ---
export interface PositionedNode extends MindMapNode {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    isRoot: boolean;
    level: number;
}

// --- Helper Functions ---
export const wrapText = (text: string, maxWidth: number): string[] => {
    if (!text) return [];
    const words = text.split(/\s+/);
    let line = '';
    const lines = [];
    
    const averageCharWidth = 8; // Adjusted for font
    const maxCharsPerLine = Math.floor(maxWidth / averageCharWidth);

    for (const word of words) {
        if (word.length > maxCharsPerLine) {
            if (line.length > 0) {
                lines.push(line);
                line = '';
            }
            let tempWord = word;
            while (tempWord.length > maxCharsPerLine) {
                lines.push(tempWord.substring(0, maxCharsPerLine));
                tempWord = tempWord.substring(maxCharsPerLine);
            }
            line = tempWord;
            continue;
        }

        const testLine = line + (line ? ' ' : '') + word;
        if (testLine.length > maxCharsPerLine && line.length > 0) {
            lines.push(line);
            line = word;
        } else {
            line = testLine;
        }
    }
    lines.push(line);
    return lines;
};

// --- New Radial Layout Algorithm ---

const layoutNode = (
    node: MindMapNode,
    level: number,
    startAngle: number,
    sweepAngle: number,
    colorIndex: number,
    centerX: number,
    centerY: number
): PositionedNode[] => {
    const lines = wrapText(node.concept, NODE_WIDTH - 20);
    const height = Math.max(NODE_BASE_HEIGHT, lines.length * 16 + 24);

    let colorClass = '';
    if (level === 0) {
        colorClass = ROOT_COLOR_CLASSES;
    } else if (level >= 2) {
        colorClass = LEVEL_2_PLUS_COLOR_CLASSES;
    } else {
        colorClass = COLOR_CLASSES[colorIndex % COLOR_CLASSES.length];
    }
    
    const positionedNode: PositionedNode = {
        ...node,
        x: centerX,
        y: centerY,
        width: NODE_WIDTH,
        height: height,
        color: colorClass,
        isRoot: level === 0,
        level: level,
    };
    
    const results: PositionedNode[] = [positionedNode];
    const children = node.subConcepts || [];
    const childCount = children.length;
    
    if (childCount === 0) {
        return results;
    }
    
    const radius = level === 0 
        ? Math.max(NODE_WIDTH, 200) 
        : Math.max(NODE_WIDTH, 160);
    
    const angleStep = sweepAngle / childCount;
    
    children.forEach((child, index) => {
        const angle = startAngle + (index + 0.5) * angleStep;
        const childX = centerX + radius * Math.cos(angle);
        const childY = centerY + radius * Math.sin(angle);
        
        // Give each child a fraction of the parent's sweep angle
        const childSweepAngle = angleStep * 0.8; 
        const childStartAngle = angle - childSweepAngle / 2;
        
        results.push(...layoutNode(child, level + 1, childStartAngle, childSweepAngle, colorIndex, childX, childY));
    });

    return results;
};


// Main layout function that orchestrates the radial layout.
export const createLayout = (rootData: MindMapNode | undefined, viewWidth: number, viewHeight: number): PositionedNode[] => {
    if (!rootData) return [];
    
    const centerX = 0;
    const centerY = 0;
    
    // The root node gets a full 360-degree sweep angle for its children.
    return layoutNode(rootData, 0, -Math.PI / 2, 2 * Math.PI, 0, centerX, centerY);
};
