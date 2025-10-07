import type { StudyData, MindMapNode } from '../types';

const mindMapToMarkdown = (nodes: MindMapNode[], level = 0): string => {
    let markdown = '';
    const prefix = '  '.repeat(level) + '- ';

    nodes.forEach(node => {
        markdown += prefix + node.concept + '\n';
        if (node.subConcepts && node.subConcepts.length > 0) {
            markdown += mindMapToMarkdown(node.subConcepts, level + 1);
        }
    });

    return markdown;
};


export const exportAsMarkdown = (studyData: StudyData) => {
    let markdownContent = '# Study Notes\n\n';

    if (studyData.summary) {
        markdownContent += `## Summary\n\n${studyData.summary}\n\n`;
    }

    if (studyData.keyInsight) {
        markdownContent += `## Key Insight\n\n*${studyData.keyInsight}*\n\n`;
    }

    if (studyData.mindMap && studyData.mindMap.length > 0) {
        markdownContent += `## Mind Map\n\n${mindMapToMarkdown(studyData.mindMap)}\n`;
    }

    const blob = new Blob([markdownContent.trim()], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'study-notes.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};