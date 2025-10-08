import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { MindMapNode as MindMapNodeType } from '../types';
import { useLocale } from '../context/LocaleContext';
import MindMapNodeComponent from '../utils/MindMapNode';
import { createLayout, PositionedNode } from '../utils/mindMapLayout';
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

interface VisualMindMapProps {
    mindMapData: MindMapNodeType[];
    onUpdate: (newMindMapData: MindMapNodeType[]) => void;
}

const VisualMindMap: React.FC<VisualMindMapProps> = ({ mindMapData, onUpdate }) => {
    const { t } = useLocale();
    const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null); // For focus mode
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    
    const isDragging = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });
    const animationFrameId = useRef<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    
    // --- Data Processing ---
    const flattenedNodes = useMemo(() => {
        if (mindMapData.length > 0) {
            return createLayout(mindMapData[0]);
        }
        return [];
    }, [mindMapData]);
    
    const { nodesById, parentMap, childrenMap } = useMemo(() => {
        const nodeMap = new Map<string, PositionedNode>();
        const parentMap = new Map<string, string>();
        const childrenMap = new Map<string, string[]>();

        flattenedNodes.forEach(node => {
            nodeMap.set(node.id, node);
             if (node.subConcepts) {
                const childIds = flattenedNodes
                    .filter(n => n.level === node.level + 1 && parentMap.get(n.id) === node.id) // This is inefficient, let's fix
                    .map(child => child.id);
                
                flattenedNodes.forEach(potentialChild => {
                    const foundParent = flattenedNodes.find(p => p.subConcepts?.some(sc => sc.id === potentialChild.id));
                    if(foundParent) {
                        parentMap.set(potentialChild.id, foundParent.id);
                    }
                });

                if (node.subConcepts) {
                    childrenMap.set(node.id, node.subConcepts.map(sc => sc.id));
                }
            }
        });
        
        // A more reliable way to build parentMap
        const buildParentMap = (node: PositionedNode, parentId: string | null) => {
             if (parentId) parentMap.set(node.id, parentId);
             const subs = flattenedNodes.filter(n => node.subConcepts?.some(sc => sc.id === n.id));
             subs.forEach(child => buildParentMap(child, node.id));
        }
        if(flattenedNodes.length > 0) buildParentMap(flattenedNodes.find(n => n.isRoot)!, null);


        return { nodesById: nodeMap, parentMap, childrenMap };
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
    
    // IDs of nodes that should be in full focus when focus mode is active
    const focusedPathIds = useMemo(() => {
        if (!focusedNodeId) return new Set<string>();
        const path = new Set<string>([focusedNodeId]);
        
        const getChildrenRecursive = (id: string) => {
            const children = flattenedNodes.filter(n => parentMap.get(n.id) === id);
            children.forEach(child => {
                path.add(child.id);
                getChildrenRecursive(child.id);
            });
        };
        getChildrenRecursive(focusedNodeId);

        return path;
    }, [focusedNodeId, parentMap, flattenedNodes]);

    const connections = useMemo(() => {
        const lines: { key: string, d: string, level: number }[] = [];
        flattenedNodes.forEach(parentNode => {
            const children = flattenedNodes.filter(n => parentMap.get(n.id) === parentNode.id);
            children.forEach(childNode => {
                 // Use a more organic-looking cubic Bézier curve
                const p1 = { x: parentNode.x, y: parentNode.y };
                const p2 = { x: childNode.x, y: childNode.y };

                const d = `M ${p1.x},${p1.y} C ${p1.x},${p1.y + 50} ${p2.x},${p2.y - 50} ${p2.x},${p2.y}`;
                lines.push({ key: `${parentNode.id}-${childNode.id}`, d, level: parentNode.level });
            });
        });
        return lines;
    }, [flattenedNodes, parentMap]);

    // --- Interaction Handlers ---
    const centerView = useCallback(() => {
        if (!svgRef.current || flattenedNodes.length === 0) return;
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        flattenedNodes.forEach(node => {
            minX = Math.min(minX, node.x - node.width / 2);
            minY = Math.min(minY, node.y - node.height / 2);
            maxX = Math.max(maxX, node.x + node.width / 2);
            maxY = Math.max(maxY, node.y + node.height / 2);
        });

        const treeWidth = maxX - minX;
        const treeHeight = maxY - minY;
        const { width: svgWidth, height: svgHeight } = svgRef.current.getBoundingClientRect();
        if (treeWidth === 0 || treeHeight === 0) return;

        const padding = 100;
        const zoomX = (svgWidth - padding) / treeWidth;
        const zoomY = (svgHeight - padding) / treeHeight;
        const newZoom = Math.min(zoomX, zoomY, 1);

        const newX = (svgWidth / 2) - ((minX + treeWidth / 2) * newZoom);
        const newY = (svgHeight / 2) - ((minY + treeHeight / 2) * newZoom) + 50; // Center vertically a bit lower
        
        setView({ x: newX, y: newY, zoom: newZoom });
    }, [flattenedNodes]);
    
    // Effect to auto-center the view when the layout changes
    useEffect(() => {
       if (flattenedNodes.length > 0) {
         centerView();
       }
    }, [flattenedNodes, centerView]);

    // Effect to select the root node when new data is loaded
    useEffect(() => {
       if (mindMapData.length > 0 && mindMapData[0]?.id) {
            setSelectedNodeId(mindMapData[0].id);
            setFocusedNodeId(null);
       }
    }, [mindMapData]);


    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        lastPos.current = { x: e.clientX, y: e.clientY };
        if (svgRef.current) svgRef.current.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;
        
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        lastPos.current = { x: e.clientX, y: e.clientY };
        
        if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        
        animationFrameId.current = requestAnimationFrame(() => {
            setView(v => ({ ...v, x: v.x + dx, y: v.y + dy }));
        });
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        if (svgRef.current) svgRef.current.style.cursor = 'grab';
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
    };
    
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (!svgRef.current) return;

        const zoomFactor = 1.1;
        const { deltaY } = e;
        const { left, top } = svgRef.current.getBoundingClientRect();

        const mouseX = e.clientX - left; // mouse position in SVG coordinates
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
        let targetX = width / 2;
        let targetY = height / 2;
        
        const selectedNode = flattenedNodes.find(n => n.id === selectedNodeId);
        if (selectedNode) {
            targetX = selectedNode.x * view.zoom + view.x;
            targetY = selectedNode.y * view.zoom + view.y;
        }

        const zoomFactor = 1.2;
        const oldZoom = view.zoom;
        const newZoom = direction === 'in' ? oldZoom * zoomFactor : oldZoom / zoomFactor;
        const clampedZoom = Math.max(0.1, Math.min(2, newZoom));

        const worldX = (targetX - view.x) / oldZoom;
        const worldY = (targetY - view.y) / oldZoom;
        
        const newX = targetX - worldX * clampedZoom;
        const newY = targetY - worldY * clampedZoom;

        setView({ x: newX, y: newY, zoom: clampedZoom });
    };

    const handleNodeSelect = (nodeId: string) => {
        setSelectedNodeId(nodeId);
        setFocusedNodeId(nodeId); // Enter focus mode on click
    };

    const handleBackgroundClick = () => {
        setSelectedNodeId(null);
        setFocusedNodeId(null); // Exit focus mode
    };
    
    // --- Editing Logic ---
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
        findAndModify(newMindMap, nodeId, (node) => {
            node.concept = newConcept;
        });
        onUpdate(newMindMap);
    }, [mindMapData, onUpdate, t]);

    const handleDeleteNode = useCallback((nodeId: string) => {
        if (!confirm(t('mindMapConfirmDelete'))) return;

        const newMindMap = JSON.parse(JSON.stringify(mindMapData));
        findAndModify(newMindMap, nodeId, (_, parent, index) => {
            parent.splice(index, 1);
        });
        onUpdate(newMindMap);
    }, [mindMapData, onUpdate, t]);
    
    const isAnyNodeHovered = !!hoveredNodeId;
    const isFocusModeActive = !!focusedNodeId;

    return (
        <div className="relative w-full h-[600px] bg-gray-50 dark:bg-[#0D1117] rounded-lg overflow-hidden border border-gray-200 dark:border-[#30363d]">
            <svg
                ref={svgRef}
                className="w-full h-full"
                style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                onClick={handleBackgroundClick}
            >
                <g transform={`translate(${view.x}, ${view.y}) scale(${view.zoom})`}>
                    {/* Render connections (lines) between nodes */}
                    {connections.map(line => {
                        const [parentId, childId] = line.key.split('-');
                        const isActive = isAnyNodeHovered && activePathIds.has(parentId) && activePathIds.has(childId);
                        const isInFocusPath = isFocusModeActive && focusedPathIds.has(parentId) && focusedPathIds.has(childId);
                        
                        let opacity = 1;
                        if (isFocusModeActive) {
                            opacity = isInFocusPath ? 1 : 0.1;
                        } else if (isAnyNodeHovered) {
                            opacity = isActive ? 1 : 0.1;
                        }
                        
                        return (
                            <path
                                key={line.key}
                                d={line.d}
                                className={`transition-all duration-300 ${(isActive || isInFocusPath) ? 'stroke-emerald-400' : 'stroke-gray-300 dark:stroke-[#444c56]'}`}
                                strokeWidth={2}
                                style={{ opacity, transition: 'opacity 300ms, stroke 300ms' }}
                                fill="none"
                            />
                        );
                    })}
                     {/* Render all the visible nodes */}
                    {flattenedNodes.map(node => {
                        const isDimmed = isFocusModeActive && !focusedPathIds.has(node.id);
                        return (
                            <MindMapNodeComponent
                                key={node.id} 
                                node={node}
                                isSelected={selectedNodeId === node.id}
                                isHighlighted={activePathIds.has(node.id)}
                                isAnyNodeHovered={isAnyNodeHovered}
                                isDimmed={isDimmed}
                                onSelect={handleNodeSelect}
                                onAdd={handleAddNode}
                                onRename={handleRenameNode}
                                onDelete={handleDeleteNode}
                                onHover={setHoveredNodeId}
                            />
                        );
                    })}
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
                    <button onClick={centerView} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600">🔄</button>
                </Tooltip>
            </div>
        </div>
    );
};

export default VisualMindMap;