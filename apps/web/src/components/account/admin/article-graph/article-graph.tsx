'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api/client';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface GraphArticle {
    id: string;
    title: string;
    slug: string;
    viewCount: number;
}

interface GraphEdge {
    id: string;
    sourceId: string;
    targetId: string;
    weight: number;
    edgeType: string;
}

interface GraphNode {
    id: string;
    name: string;
    slug: string;
    val: number;
    color: string;
}

interface GraphLink {
    source: string;
    target: string;
    weight: number;
    edgeType: string;
    color: string;
}

const EDGE_COLORS: Record<string, string> = {
    tag: '#22c55e',
    view: '#3b82f6',
    manual: '#ef4444',
};

export function ArticleGraph() {
    const router = useRouter();
    const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: Math.max(500, window.innerHeight - 250),
                });
            }
        };
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        setTimeout(updateDimensions, 1000)
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get<{ articles: GraphArticle[]; edges: GraphEdge[] }>('/articles/graph');
                const articles = data.articles ?? [];
                const edges = data.edges ?? [];

                const maxViews = Math.max(1, ...articles.map((a) => a.viewCount ?? 0));

                const nodes: GraphNode[] = articles.map((a) => ({
                    id: a.id,
                    name: a.title.length > 30 ? a.title.slice(0, 30) + '...' : a.title,
                    slug: a.slug,
                    val: 3 + ((a.viewCount ?? 0) / maxViews) * 12,
                    color: '#D7102A',
                }));

                // Deduplicate edges (keep highest weight per source-target pair)
                const edgeMap = new Map<string, GraphEdge>();
                for (const e of edges) {
                    const key = [e.sourceId, e.targetId].sort().join('-');
                    const existing = edgeMap.get(key);
                    if (!existing || e.weight > existing.weight) {
                        edgeMap.set(key, e);
                    }
                }

                const nodeIds = new Set(nodes.map((n) => n.id));
                const links: GraphLink[] = [...edgeMap.values()]
                    .filter((e) => nodeIds.has(e.sourceId) && nodeIds.has(e.targetId))
                    .map((e) => ({
                        source: e.sourceId,
                        target: e.targetId,
                        weight: e.weight,
                        edgeType: e.edgeType,
                        color: EDGE_COLORS[e.edgeType] ?? '#999',
                    }));

                setGraphData({ nodes, links });
            } catch {
                // ignore
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleNodeClick = useCallback((node: any) => {
        setSelectedNode(node);
    }, []);

    if (loading) {
        return <p className="text-sm text-text-sub p-4">Загрузка графа...</p>;
    }

    if (graphData.nodes.length === 0) {
        return <p className="text-sm text-text-sub p-4">Нет данных для графа</p>;
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Legend */}
            <div className="flex gap-6 text-xs text-text-sub">
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#22c55e] inline-block" /> Теги
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#3b82f6] inline-block" /> Просмотры
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#ef4444] inline-block" /> Вручную
                </span>
                <span className="text-text-sub/50">Размер узла = количество просмотров</span>
            </div>

            {/* Graph */}
            <div ref={containerRef} className="border border-border-light/30 rounded bg-white overflow-hidden">
                <ForceGraph2D
                    graphData={graphData}
                    width={dimensions.width}
                    height={dimensions.height}
                    nodeLabel="name"
                    nodeColor="color"
                    nodeVal="val"
                    linkColor="color"
                    linkWidth={(link: any) => 1 + link.weight * 3}
                    linkDirectionalParticles={0}
                    onNodeClick={handleNodeClick}
                    nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                        const label = node.name;
                        const fontSize = Math.max(10 / globalScale, 3);
                        const nodeSize = node.val ?? 5;

                        // Node circle
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
                        ctx.fillStyle = node === selectedNode ? '#ff6b6b' : node.color;
                        ctx.fill();

                        // Label
                        if (globalScale > 0.7) {
                            ctx.font = `${fontSize}px sans-serif`;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'top';
                            ctx.fillStyle = '#323232';
                            ctx.fillText(label, node.x, node.y + nodeSize + 2);
                        }
                    }}
                    nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
                        const nodeSize = node.val ?? 5;
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, nodeSize + 2, 0, 2 * Math.PI);
                        ctx.fillStyle = color;
                        ctx.fill();
                    }}
                />
            </div>

            {/* Selected node info */}
            {selectedNode && (
                <div className="flex items-center gap-4 p-3 bg-white border border-border-light/30 rounded text-sm">
                    <span className="font-medium text-text-main">{selectedNode.name}</span>
                    <button
                        type="button"
                        onClick={() => router.push(`/account/articles/${selectedNode.id}`)}
                        className="text-brand-red underline text-xs cursor-pointer"
                    >
                        Редактировать
                    </button>
                    <button
                        type="button"
                        onClick={() => window.open(`/articles/${selectedNode.slug}`, '_blank')}
                        className="text-text-sub underline text-xs cursor-pointer"
                    >
                        Открыть
                    </button>
                </div>
            )}
        </div>
    );
}
