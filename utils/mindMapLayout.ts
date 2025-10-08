import type { MindMapNode } from '../types';

// --- Constants for Layout and Styling ---
export const NODE_WIDTH = 150;
export const NODE_BASE_HEIGHT = 50;
const HORIZONTAL_SPACING = 40;
const VERTICAL_SPACING = 100;

// Defines Tailwind class strings for node colors
export const ROOT_COLOR_CLASSES = 'fill-slate-800 dark:fill-slate-200';
export const ROOT_TEXT_COLOR_CLASSES = 'fill-white dark:fill-slate-800';
export const LEVEL_2_PLUS_COLOR_CLASSES = 'fill-slate-50 dark:fill-slate-700';
export const LEVEL_2_PLUS_TEXT_COLOR_CLASSES = 'fill-slate-700 dark:fill-slate-200';
export const COLORS = [
    { fill: 'fill-yellow-200/80 dark:fill-yellow-800/60', text: 'fill-yellow-900 dark:fill-yellow-100' },
    { fill: 'fill-sky-200/80 dark:fill-sky-800/60', text: 'fill-sky-900 dark:fill-sky-100' },
    { fill: 'fill-emerald-200/80 dark:fill-emerald-800/60', text: 'fill-emerald-900 dark:fill-emerald-100' },
    { fill: 'fill-red-200/80 dark:fill-red-800/60', text: 'fill-red-900 dark:fill-red-100' },
    { fill: 'fill-violet-200/80 dark:fill-violet-800/60', text: 'fill-violet-900 dark:fill-violet-100' },
    { fill: 'fill-pink-200/80 dark:fill-pink-800/60', text: 'fill-pink-900 dark:fill-pink-100' },
];

// --- Type Definitions ---
// Temporary node structure used during layout calculation
type LayoutNode = MindMapNode & {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    textColor: string;
    isRoot: boolean;
    level: number;
    modifier: number; // For shifting subtrees
    children: LayoutNode[];
    parent?: LayoutNode;
};

export interface PositionedNode extends MindMapNode {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    textColor: string;
    isRoot: boolean;
    level: number;
}


// --- Helper Functions ---
export const wrapText = (text: string, maxWidth: number): string[] => {
    if (!text) return [];
    const words = text.split(/\s+/);
    let line = '';
    const lines = [];
    const averageCharWidth = 8;
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

// --- New Hierarchical Tree Layout Algorithm ---

// Creates the internal tree structure needed for layout calculations.
function buildLayoutTree(
    node: MindMapNode,
    level: number,
    colorIndex: number,
    parent?: LayoutNode
): LayoutNode {
    const lines = wrapText(node.concept, NODE_WIDTH - 20);
    const height = Math.max(NODE_BASE_HEIGHT, lines.length * 16 + 24);

    let colorClass, textColorClass;
    if (level === 0) {
        colorClass = ROOT_COLOR_CLASSES;
        textColorClass = ROOT_TEXT_COLOR_CLASSES;
    } else if (level >= 2) {
        const parentColorSet = COLORS[parent ? parent.level === 1 ? (parent as any).colorIndex : -1 : -1];
        colorClass = parentColorSet ? LEVEL_2_PLUS_COLOR_CLASSES : LEVEL_2_PLUS_COLOR_CLASSES; // Fallback
        textColorClass = parentColorSet ? LEVEL_2_PLUS_TEXT_COLOR_CLASSES : LEVEL_2_PLUS_TEXT_COLOR_CLASSES;
    } else {
        const colorSet = COLORS[colorIndex % COLORS.length];
        colorClass = colorSet.fill;
        textColorClass = colorSet.text;
    }

    const layoutNode: LayoutNode = {
        ...node,
        x: 0, y: level * VERTICAL_SPACING,
        width: NODE_WIDTH, height: height,
        color: colorClass, textColor: textColorClass,
        isRoot: level === 0, level: level,
        modifier: 0, parent: parent,
        children: [],
        ...(level === 1 && { colorIndex }),
    };

    if (node.subConcepts) {
        layoutNode.children = node.subConcepts.map((child, i) =>
            buildLayoutTree(child, level + 1, i, layoutNode)
        );
    }
    return layoutNode;
}


// First pass: a post-order traversal to calculate initial positions and modifiers.
function firstPass(node: LayoutNode) {
    node.children.forEach(firstPass);
    if (node.children.length > 0) {
        // Center parent over children
        const childrenWidth = node.children[node.children.length - 1].x - node.children[0].x;
        node.x = node.children[0].x + childrenWidth / 2;
    }

    if (node.parent && node !== node.parent.children[0]) {
        const previousSibling = node.parent.children[node.parent.children.indexOf(node) - 1];
        const requiredSpacing = (previousSibling.width + node.width) / 2 + HORIZONTAL_SPACING;
        const currentSpacing = node.x - previousSibling.x;
        if (currentSpacing < requiredSpacing) {
            const shift = requiredSpacing - currentSpacing;
            node.x += shift;
            node.modifier += shift;
        }
    }
}

// Second pass: a pre-order traversal to apply modifiers and calculate final positions.
function secondPass(node: LayoutNode, modSum = 0) {
    node.x += modSum;
    node.children.forEach(child => secondPass(child, modSum + node.modifier));
}


export const createLayout = (rootData: MindMapNode | undefined): PositionedNode[] => {
    if (!rootData) return [];

    const layoutRoot = buildLayoutTree(rootData, 0, 0);

    firstPass(layoutRoot);
    
    // Center the tree
    const extents = getTreeExtents(layoutRoot);
    const shiftX = -extents.min;
    layoutRoot.x += shiftX;
    layoutRoot.modifier += shiftX;
    
    secondPass(layoutRoot);

    const flattenedNodes: PositionedNode[] = [];
    const queue = [layoutRoot];
    while (queue.length > 0) {
        const node = queue.shift()!;
        flattenedNodes.push({
            id: node.id,
            concept: node.concept,
            subConcepts: node.subConcepts,
            x: node.x,
            y: node.y,
            width: node.width,
            height: node.height,
            color: node.color,
            textColor: node.textColor,
            isRoot: node.isRoot,
            level: node.level,
        });
        queue.push(...node.children);
    }
    return flattenedNodes;
};

// Helper to find the horizontal boundaries of the tree for centering.
function getTreeExtents(node: LayoutNode): { min: number, max: number } {
    let min = node.x - node.width / 2;
    let max = node.x + node.width / 2;
    node.children.forEach(child => {
        const childExtents = getTreeExtents(child);
        min = Math.min(min, childExtents.min);
        max = Math.max(max, childExtents.max);
    });
    return { min, max };
}