'use client';

import { useState, useEffect } from 'react';
import { Button, Input } from '@asko/ui';
import { api } from '@/lib/api/client';
import { articleApi } from '@/lib/api/article';

interface Edge {
    id: string;
    sourceId: string;
    targetId: string;
    weight: number;
    edgeType: string;
}

interface ArticleSummary {
    id: string;
    title: string;
    slug: string;
}

const EDGE_TYPE_LABELS: Record<string, string> = {
    tag: 'Теги',
    view: 'Просмотры',
    manual: 'Вручную',
};

const EDGE_TYPE_COLORS: Record<string, string> = {
    tag: 'bg-green-100 text-green-800',
    view: 'bg-blue-100 text-blue-800',
    manual: 'bg-red-100 text-red-800',
};

export function ArticleEdges({ articleId }: { articleId: string }) {
    const [edges, setEdges] = useState<Edge[]>([]);
    const [articles, setArticles] = useState<Map<string, ArticleSummary>>(new Map());
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ArticleSummary[]>([]);
    const [newWeight, setNewWeight] = useState(0.5);

    const fetchEdges = async () => {
        try {
            const { data } = await api.get<{ edges: Edge[] }>(`/articles/${articleId}/edges`);
            setEdges(data.edges ?? []);

            // Fetch article titles for connected nodes
            const targetIds = (data.edges ?? []).map((e) => e.targetId);
            if (targetIds.length > 0) {
                const map = new Map<string, ArticleSummary>();
                for (const id of targetIds) {
                    try {
                        const { data: article } = await articleApi.getOne(id);
                        map.set(id, { id: article.id, title: article.title, slug: article.slug });
                    } catch {
                        map.set(id, { id, title: id.slice(0, 8) + '...', slug: '' });
                    }
                }
                setArticles(map);
            }
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEdges();
    }, [articleId]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        try {
            const { data } = await articleApi.getAll({ search: searchQuery, limit: 5 });
            setSearchResults(
                (data.data ?? [])
                    .filter((a) => a.id !== articleId)
                    .map((a) => ({ id: a.id, title: a.title, slug: a.slug })),
            );
        } catch {
            setSearchResults([]);
        }
    };

    const handleLink = async (targetId: string) => {
        try {
            await api.post(`/articles/${articleId}/link`, { targetId, weight: newWeight });
            setShowAdd(false);
            setSearchQuery('');
            setSearchResults([]);
            setNewWeight(0.5);
            await fetchEdges();
        } catch {
            // ignore
        }
    };

    const handleUnlink = async (targetId: string) => {
        try {
            await api.delete(`/articles/${articleId}/link/${targetId}`);
            await fetchEdges();
        } catch {
            // ignore
        }
    };

    if (loading) {
        return <p className="text-xs text-text-sub">Загрузка связей...</p>;
    }

    // Group edges by target and pick the highest weight per target
    const grouped = new Map<string, Edge[]>();
    for (const e of edges) {
        if (!grouped.has(e.targetId)) grouped.set(e.targetId, []);
        grouped.get(e.targetId)!.push(e);
    }

    return (
        <div className="flex flex-col gap-3">
            {grouped.size === 0 && !showAdd && (
                <p className="text-xs text-text-sub">Нет связей</p>
            )}

            {grouped.size > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-text-sub text-xs border-b border-border-light/30">
                                <th className="py-2 pr-4">Статья</th>
                                <th className="py-2 pr-4 w-20">Вес</th>
                                <th className="py-2 pr-4 w-28">Тип</th>
                                <th className="py-2 w-16"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...grouped.entries()].map(([targetId, targetEdges]) => {
                                const article = articles.get(targetId);
                                const maxEdge = targetEdges.reduce((a, b) => a.weight > b.weight ? a : b);
                                return (
                                    <tr key={targetId} className="border-b border-border-light/10">
                                        <td className="py-2 pr-4">
                                            <span className="text-text-main">{article?.title ?? targetId}</span>
                                        </td>
                                        <td className="py-2 pr-4 font-mono text-xs">
                                            {maxEdge.weight.toFixed(2)}
                                        </td>
                                        <td className="py-2 pr-4">
                                            <div className="flex gap-1">
                                                {targetEdges.map((e) => (
                                                    <span
                                                        key={e.id}
                                                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${EDGE_TYPE_COLORS[e.edgeType] ?? 'bg-gray-100 text-gray-600'}`}
                                                    >
                                                        {EDGE_TYPE_LABELS[e.edgeType] ?? e.edgeType}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="py-2">
                                            {targetEdges.some((e) => e.edgeType === 'manual') && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleUnlink(targetId)}
                                                    className="text-xs text-brand-red hover:underline"
                                                >
                                                    Удалить
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {showAdd ? (
                <div className="flex flex-col gap-3 p-3 bg-gray-50 border border-border-light/30 rounded">
                    <div className="flex gap-2">
                        <Input
                            type="text"
                            placeholder="Поиск статьи..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="flex-1"
                        />
                        <Button variant="secondary" size="sm" onClick={handleSearch}>
                            Найти
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-text-sub">
                        <span>Вес:</span>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={newWeight}
                            onChange={(e) => setNewWeight(parseFloat(e.target.value))}
                            className="flex-1"
                        />
                        <span className="font-mono w-8">{newWeight.toFixed(2)}</span>
                    </div>

                    {searchResults.length > 0 && (
                        <div className="flex flex-col gap-1">
                            {searchResults.map((a) => (
                                <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => handleLink(a.id)}
                                    className="text-left text-sm px-2 py-1.5 hover:bg-surface rounded transition-colors"
                                >
                                    {a.title}
                                </button>
                            ))}
                        </div>
                    )}

                    <Button variant="secondary" size="sm" onClick={() => { setShowAdd(false); setSearchResults([]); }}>
                        Отмена
                    </Button>
                </div>
            ) : (
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowAdd(true)}
                    className="self-start"
                >
                    + Добавить связь
                </Button>
            )}
        </div>
    );
}
