import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
// FIX: Import PositionedNode from the central types.ts file.
import type { MindMapNode as MindMapNodeType, PositionedNode } from '../types';
import { useLocale } from '../context/LocaleContext';
import MindMapNodeComponent from '../utils/MindMapNode';
// FIX: PositionedNode is no longer exported from mindMapLayout, so it's removed from this import.
import { createLayout } from '../utils/mindMapLayout';
import Tooltip from './Tooltip';

// A helper to generate simple unique IDs for new mind map nodes.
const simpleUUID = () => `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// Recursively searches for a node and its parent, then applies a modification.
const findAndModify = (
    nodes: MindMapNodeType[],
    targetId: string,
    callback: (node: MindMapNodeType, parent: MindMapNodeType[], index: number) => void
): boolean => {
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.id === targetId) {
            callback(node, nodes, i);
            return true;
        }
        if (node.subConcepts && findAndModify(node.subConcepts, targetId, callback)) {
            return true;
        }
    }
    return false;
};

const PALETTE = [
    { fill: 'fill-yellow-200/80 dark:fill-yellow-800/60', text: 'fill-yellow-900 dark:fill-yellow-100' },
    { fill: 'fill-sky-200/80 dark:fill-sky-800/60', text: 'fill-sky-900 dark:fill-sky-100' },
    { fill: 'fill-emerald-200/80 dark:fill-emerald-800/60', text: 'fill-emerald-900 dark:fill-emerald-100' },
    { fill: 'fill-red-200/80 dark:fill-red-800/60', text: 'fill-red-900 dark:fill-red-100' },
    { fill: 'fill-violet-200/80 dark:fill-violet-800/60', text: 'fill-violet-900 dark:fill-violet-100' },
    { fill: 'fill-slate-50 dark:fill-slate-700', text: 'fill-slate-700 dark:fill-slate-200' },
];

interface VisualMindMapProps {
    mindMapData: MindMapNodeType[];
    onUpdate: (newMindMapData: MindMapNodeType[]) => void;
}

const VisualMindMap: React.FC<VisualMindMapProps> = ({ mindMapData, onUpdate }) => {
    const { t } = useLocale();
    const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [draggedNode, setDraggedNode] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
    
    const isPanning = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });
    const svgRef = useRef<SVGSVGElement>(null);
    
    // --- Data Processing ---
    const autoLayoutNodes = useMemo(() => {
        if (mindMapData.length > 0) {
            return createLayout(mindMapData[0]);
        }
        return [];
    }, [mindMapData]); // Reruns layout when structure changes

    const manualPositions = useMemo(() => {
        const positions = new Map<string, { x: number; y: number }>();
        const dive = (nodes: MindMapNodeType[]) => {
            nodes.forEach(node => {
                if (node.x !== undefined && node.y !== undefined) {
                    positions.set(node.id, { x: node.x, y: node.y });
                }
                if (node.subConcepts) dive(node.subConcepts);
            });
        };
        dive(mindMapData);
        return positions;
    }, [mindMapData]);

    const flattenedNodes = useMemo(() => {
        return autoLayoutNodes.map(node => ({
            ...node,
            ...(manualPositions.get(node.id)) // Override with manual positions if they exist
        }));
    }, [autoLayoutNodes, manualPositions]);
    
    const { parentMap } = useMemo(() => {
        const parentMap = new Map<string, string>();
        const buildParentMap = (node: PositionedNode, parentId: string | null) => {
             if (parentId) parentMap.set(node.id, parentId);
             const children = flattenedNodes.filter(child => node.subConcepts?.some(sc => sc.id === child.id));
             children.forEach(child => buildParentMap(child, node.id));
        }
        const root = flattenedNodes.find(n => n.isRoot);
        if(root) buildParentMap(root, null);
        return { parentMap };
    }, [flattenedNodes]);

    const activePathIds = useMemo(() => {
        if (!hoveredNodeId) return new Set<string>();
        const path = new Set<string>([hoveredNodeId]);
        let currentId: string | undefined = hoveredNodeId;
        while (currentId) {
            const parentId = parentMap.get(currentId);
            if (parentId) {
                path.add(parentId);
            }
            currentId = parentId;
        }
        return path;
    }, [hoveredNodeId, parentMap]);

    const connections = useMemo(() => {
        const lines: { key: string, d: string, level: number }[] = [];
        flattenedNodes.forEach(parentNode => {
            const children = flattenedNodes.filter(n => parentMap.get(n.id) === parentNode.id);
            children.forEach(childNode => {
                const p1 = { x: parentNode.x, y: parentNode.y };
                const p2 = { x: childNode.x, y: childNode.y };
                const d = `M ${p1.x},${p1.y} C ${p1.x},${p1.y + 50} ${p2.x},${p2.y - 50} ${p2.x},${p2.y}`;
                lines.push({ key: `${parentNode.id}-${childNode.id}`, d, level: parentNode.level });
            });
        });
        return lines;
    }, [flattenedNodes, parentMap]);

    // --- Interaction Handlers ---
    const centerView = useCallback((shouldZoomFit = true) => {
        if (!svgRef.current || flattenedNodes.length === 0) return;
        
        const { width: svgWidth, height: svgHeight } = svgRef.current.getBoundingClientRect();
        
        if (shouldZoomFit) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            flattenedNodes.forEach(node => {
                minX = Math.min(minX, node.x - node.width / 2);
                minY = Math.min(minY, node.y - node.height / 2);
                maxX = Math.max(maxX, node.x + node.width / 2);
                maxY = Math.max(maxY, node.y + node.height / 2);
            });

            const treeWidth = maxX - minX;
            const treeHeight = maxY - minY;
            if (treeWidth === 0 || treeHeight === 0) return;

            const padding = 100;
            const zoomX = (svgWidth - padding) / treeWidth;
            const zoomY = (svgHeight - padding) / treeHeight;
            const newZoom = Math.min(zoomX, zoomY, 1);

            const newX = (svgWidth / 2) - ((minX + treeWidth / 2) * newZoom);
            const newY = (svgHeight / 2) - ((minY + treeHeight / 2) * newZoom);
            setView({ x: newX, y: newY, zoom: newZoom });
        } else {
            const rootNode = flattenedNodes.find(n => n.isRoot);
            if (rootNode) {
                const newX = svgWidth / 2 - rootNode.x * view.zoom;
                const newY = svgHeight / 2 - rootNode.y * view.zoom;
                setView(v => ({ ...v, x: newX, y: newY }));
            }
        }
    }, [flattenedNodes, view.zoom]);
    
    useEffect(() => {
        if (flattenedNodes.length > 0) centerView(true);
    }, [autoLayoutNodes]); // Only zoom-fit when the base layout changes

    useEffect(() => {
       if (mindMapData.length > 0 && mindMapData[0]?.id) setSelectedNodeId(mindMapData[0].id);
    }, [mindMapData]);

    const handleMouseDown = (e: React.MouseEvent) => {
        // This is for panning the canvas
        if (e.target === svgRef.current) {
            isPanning.current = true;
            lastPos.current = { x: e.clientX, y: e.clientY };
            if (svgRef.current) svgRef.current.style.cursor = 'grabbing';
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning.current) {
            const dx = e.clientX - lastPos.current.x;
            const dy = e.clientY - lastPos.current.y;
            lastPos.current = { x: e.clientX, y: e.clientY };
            setView(v => ({ ...v, x: v.x + dx, y: v.y + dy }));
        } else if (draggedNode && svgRef.current) {
            const CTM = svgRef.current.getScreenCTM();
            if (CTM) {
                const newX = (e.clientX - CTM.e) / CTM.a - draggedNode.offsetX;
                const newY = (e.clientY - CTM.f) / CTM.d - draggedNode.offsetY;
                
                const newMindMap = JSON.parse(JSON.stringify(mindMapData));
                findAndModify(newMindMap, draggedNode.id, (node) => {
                    node.x = newX;
                    node.y = newY;
                });
                onUpdate(newMindMap);
            }
        }
    };
    
    const handleMouseUpOrLeave = () => {
        isPanning.current = false;
        if (svgRef.current) svgRef.current.style.cursor = 'grab';
        if (draggedNode) {
            setDraggedNode(null);
        }
    };
    
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (!svgRef.current) return;
        const zoomFactor = 1.1;
        const { deltaY } = e;
        const { left, top } = svgRef.current.getBoundingClientRect();
        const mouseX = e.clientX - left;
        const mouseY = e.clientY - top;
        const oldZoom = view.zoom;
        const newZoom = deltaY < 0 ? oldZoom * zoomFactor : oldZoom / zoomFactor;
        const clampedZoom = Math.max(0.1, Math.min(2, newZoom));
        const worldX = (mouseX - view.x) / oldZoom;
        const worldY = (mouseY - view.y) / oldZoom;
        const newX = mouseX - worldX * clampedZoom;
        const newY = mouseY - worldY * clampedZoom;
        setView({ x: newX, y: newY, zoom: clampedZoom });
    };

    const handleZoom = (direction: 'in' | 'out') => {
        if (!svgRef.current) return;
        const { width, height } = svgRef.current.getBoundingClientRect();
        const zoomFactor = 1.2;
        const oldZoom = view.zoom;
        const newZoom = direction === 'in' ? oldZoom * zoomFactor : oldZoom / zoomFactor;
        const clampedZoom = Math.max(0.1, Math.min(2, newZoom));
        const newX = view.x - (width / 2 - view.x) * (clampedZoom / oldZoom - 1);
        const newY = view.y - (height / 2 - view.y) * (clampedZoom / oldZoom - 1);
        setView({ x: newX, y: newY, zoom: clampedZoom });
    };

    const handleBackgroundClick = () => setSelectedNodeId(null);
    
    // --- Editing Logic ---
    const handleDragStart = useCallback((e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        if (svgRef.current) {
            const node = flattenedNodes.find(n => n.id === nodeId);
            if (!node) return;

            const CTM = svgRef.current.getScreenCTM();
            if (CTM) {
                const startX = (e.clientX - CTM.e) / CTM.a;
                const startY = (e.clientY - CTM.f) / CTM.d;
                setDraggedNode({
                    id: nodeId,
                    offsetX: startX - node.x,
                    offsetY: startY - node.y,
                });
            }
        }
    }, [flattenedNodes]);

    const handleUpdateNodeStyle = useCallback((nodeId: string, style: Partial<MindMapNodeType>) => {
        const newMindMap = JSON.parse(JSON.stringify(mindMapData));
        findAndModify(newMindMap, nodeId, (node) => {
           Object.assign(node, style);
        });
        onUpdate(newMindMap);
    }, [mindMapData, onUpdate]);

    const handleAddNode = useCallback((parentId: string) => {
        const newConcept = prompt(t('mindMapEnterConcept'));
        if (!newConcept || !newConcept.trim()) return;
        const newMindMap = JSON.parse(JSON.stringify(mindMapData));
        findAndModify(newMindMap, parentId, (node) => {
            if (!node.subConcepts) node.subConcepts = [];
            node.subConcepts.push({ id: simpleUUID(), concept: newConcept, subConcepts: [] });
        });
        onUpdate(newMindMap);
    }, [mindMapData, onUpdate, t]);
    
    const handleRenameNode = useCallback((nodeId: string, oldConcept: string) => {
        const newConcept = prompt(t('mindMapRenameConcept'), oldConcept);
        if (!newConcept || !newConcept.trim() || newConcept === oldConcept) return;
        const newMindMap = JSON.parse(JSON.stringify(mindMapData));
        findAndModify(newMindMap, nodeId, (node) => { node.concept = newConcept; });
        onUpdate(newMindMap);
    }, [mindMapData, onUpdate, t]);

    const handleDeleteNode = useCallback((nodeId: string) => {
        if (!confirm(t('mindMapConfirmDelete'))) return;
        const newMindMap = JSON.parse(JSON.stringify(mindMapData));
        findAndModify(newMindMap, nodeId, (_, parent, index) => { parent.splice(index, 1); });
        onUpdate(newMindMap);
        setSelectedNodeId(null);
    }, [mindMapData, onUpdate, t]);
    
    return (
        <div className="relative w-full h-[600px] bg-gray-50 dark:bg-[#0D1117] rounded-lg overflow-hidden border border-gray-200 dark:border-[#30363d]">
            <svg
                ref={svgRef}
                className="w-full h-full"
                style={{ cursor: isPanning.current ? 'grabbing' : 'grab' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                onWheel={handleWheel}
                onClick={handleBackgroundClick}
            >
                <g transform={`translate(${view.x}, ${view.y}) scale(${view.zoom})`}>
                    {connections.map(line => (
                        <path
                            key={line.key}
                            d={line.d}
                            className={`transition-all duration-300 ${activePathIds.size > 0 && activePathIds.has(line.key.split('-')[0]) && activePathIds.has(line.key.split('-')[1]) ? 'stroke-emerald-400' : 'stroke-gray-300 dark:stroke-[#444c56]'}`}
                            strokeWidth={2}
                            style={{ opacity: activePathIds.size === 0 || (activePathIds.has(line.key.split('-')[0]) && activePathIds.has(line.key.split('-')[1])) ? 1 : 0.1, transition: 'opacity 300ms, stroke 300ms' }}
                            fill="none"
                        />
                    ))}
                    {flattenedNodes.map(node => (
                        <MindMapNodeComponent
                            key={node.id} 
                            node={node}
                            isSelected={selectedNodeId === node.id}
                            isHighlighted={activePathIds.has(node.id)}
                            isDimmed={activePathIds.size > 0 && !activePathIds.has(node.id)}
                            onSelect={(id) => setSelectedNodeId(id)}
                            onAdd={handleAddNode}
                            onRename={handleRenameNode}
                            onDelete={handleDeleteNode}
                            onHover={setHoveredNodeId}
                            onUpdateStyle={handleUpdateNodeStyle}
                            onDragStart={handleDragStart}
                            palette={PALETTE}
                        />
                    ))}
                </g>
            </svg>
            <div className="absolute bottom-2 right-2 flex gap-1 bg-white/50 dark:bg-[#21262d]/70 backdrop-blur-sm p-1 rounded-lg shadow-md no-print">
                <Tooltip text={t('tooltip_zoomIn')}>
                    <button onClick={() => handleZoom('in')} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600">🔎+</button>
                </Tooltip>
                <Tooltip text={t('tooltip_zoomOut')}>
                    <button onClick={() => handleZoom('out')} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600">🔎-</button>
                </Tooltip>
                <Tooltip text={t('tooltip_resetView')}>
                    <button onClick={() => centerView(false)} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600">🔄</button>
                </Tooltip>
            </div>
        </div>
    );
};

export default VisualMindMap;