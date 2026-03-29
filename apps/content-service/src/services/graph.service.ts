import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { Article } from 'entities/article.entity';
import { ArticleView } from 'entities/article-view.entity';
import { ArticleEdge, EdgeType } from 'entities/article-edge.entity';

const TAG_WEIGHT_FACTOR = 0.4;
const COVIEW_WEIGHT_FACTOR = 0.6;
const REBUILD_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class GraphService implements OnModuleInit, OnModuleDestroy {
    private rebuildTimer: ReturnType<typeof setInterval> | null = null;

    constructor(private readonly em: EntityManager) {}

    onModuleInit() {
        // Periodic full rebuild for co-view patterns
        this.rebuildTimer = setInterval(() => {
            this.rebuildAllEdges().catch((e) =>
                console.error('Graph rebuild failed:', e),
            );
        }, REBUILD_INTERVAL_MS);
    }

    onModuleDestroy() {
        if (this.rebuildTimer) clearInterval(this.rebuildTimer);
    }

    // ─── Called on article create/update ──────────────────────────────

    @CreateRequestContext()
    async recalculateTagEdges(articleId: string): Promise<void> {
        const article = await this.em.findOne(Article, { id: articleId });
        if (!article || !article.tags?.length) return;

        const others = await this.em.find(Article, { id: { $ne: articleId } });

        for (const other of others) {
            const otherTags = other.tags ?? [];
            if (otherTags.length === 0) continue;

            const shared = article.tags.filter((t) => otherTags.includes(t)).length;
            if (shared === 0) {
                // Remove tag edge if it exists
                await this.em.nativeDelete(ArticleEdge, {
                    sourceId: articleId,
                    targetId: other.id,
                    edgeType: EdgeType.TAG,
                });
                await this.em.nativeDelete(ArticleEdge, {
                    sourceId: other.id,
                    targetId: articleId,
                    edgeType: EdgeType.TAG,
                });
                continue;
            }

            const weight = shared / Math.max(article.tags.length, otherTags.length);
            await this.upsertEdge(articleId, other.id, weight, EdgeType.TAG);
            await this.upsertEdge(other.id, articleId, weight, EdgeType.TAG);
        }
    }

    // ─── Periodic full rebuild ────────────────────────────────────────

    @CreateRequestContext()
    async rebuildAllEdges(): Promise<void> {
        const articles = await this.em.find(Article, {});
        if (articles.length < 2) return;

        // 1. Rebuild tag edges
        for (const article of articles) {
            if (!article.tags?.length) continue;
            for (const other of articles) {
                if (article.id === other.id) continue;
                const otherTags = other.tags ?? [];
                if (otherTags.length === 0) continue;
                const shared = article.tags.filter((t) => otherTags.includes(t)).length;
                if (shared === 0) continue;
                const weight = shared / Math.max(article.tags.length, otherTags.length);
                await this.upsertEdge(article.id, other.id, weight, EdgeType.TAG);
            }
        }

        // 2. Rebuild co-view edges (Jaccard similarity)
        const articleIds = articles.map((a) => a.id);
        const views = await this.em.find(ArticleView, { articleId: { $in: articleIds } });

        // Build user→articles map
        const userArticles = new Map<string, Set<string>>();
        for (const v of views) {
            const key = v.userId || v.sessionId;
            if (!userArticles.has(key)) userArticles.set(key, new Set());
            userArticles.get(key)!.add(v.articleId);
        }

        // Build article→viewers map
        const articleViewers = new Map<string, Set<string>>();
        for (const [user, arts] of userArticles) {
            for (const artId of arts) {
                if (!articleViewers.has(artId)) articleViewers.set(artId, new Set());
                articleViewers.get(artId)!.add(user);
            }
        }

        // Compute Jaccard similarity for all pairs
        for (let i = 0; i < articleIds.length; i++) {
            const viewersA = articleViewers.get(articleIds[i]);
            if (!viewersA || viewersA.size === 0) continue;

            for (let j = i + 1; j < articleIds.length; j++) {
                const viewersB = articleViewers.get(articleIds[j]);
                if (!viewersB || viewersB.size === 0) continue;

                let intersection = 0;
                for (const u of viewersA) {
                    if (viewersB.has(u)) intersection++;
                }
                if (intersection === 0) continue;

                const union = viewersA.size + viewersB.size - intersection;
                const jaccard = intersection / union;

                await this.upsertEdge(articleIds[i], articleIds[j], jaccard, EdgeType.VIEW);
                await this.upsertEdge(articleIds[j], articleIds[i], jaccard, EdgeType.VIEW);
            }
        }
    }

    // ─── Manual linking (admin) ───────────────────────────────────────

    @CreateRequestContext()
    async setManualEdge(sourceId: string, targetId: string, weight: number): Promise<void> {
        await this.upsertEdge(sourceId, targetId, weight, EdgeType.MANUAL);
        await this.upsertEdge(targetId, sourceId, weight, EdgeType.MANUAL);
    }

    @CreateRequestContext()
    async removeManualEdge(sourceId: string, targetId: string): Promise<void> {
        await this.em.nativeDelete(ArticleEdge, { sourceId, targetId, edgeType: EdgeType.MANUAL });
        await this.em.nativeDelete(ArticleEdge, { sourceId: targetId, targetId: sourceId, edgeType: EdgeType.MANUAL });
    }

    // ─── Queries ──────────────────────────────────────────────────────

    @CreateRequestContext()
    async getConnected(articleId: string, limit = 4): Promise<{ articleId: string; weight: number }[]> {
        // Aggregate all edge types per target, pick max weight per pair
        const edges = await this.em.find(
            ArticleEdge,
            { sourceId: articleId },
            { orderBy: { weight: 'DESC' } },
        );

        // Merge edges by target: for each target, compute combined weight
        const targetWeights = new Map<string, number>();
        const targetManual = new Map<string, number>();

        for (const edge of edges) {
            if (edge.edgeType === EdgeType.MANUAL) {
                targetManual.set(edge.targetId, edge.weight);
            } else {
                const current = targetWeights.get(edge.targetId) ?? { tag: 0, view: 0 };
                if (edge.edgeType === EdgeType.TAG) {
                    targetWeights.set(edge.targetId, (typeof current === 'number' ? 0 : 0) + edge.weight);
                }
            }
        }

        // Recompute properly: collect per-type weights
        const combined = new Map<string, number>();
        const tagWeights = new Map<string, number>();
        const viewWeights = new Map<string, number>();

        for (const edge of edges) {
            if (edge.edgeType === EdgeType.TAG) tagWeights.set(edge.targetId, edge.weight);
            if (edge.edgeType === EdgeType.VIEW) viewWeights.set(edge.targetId, edge.weight);
            if (edge.edgeType === EdgeType.MANUAL) targetManual.set(edge.targetId, edge.weight);
        }

        const allTargets = new Set([...tagWeights.keys(), ...viewWeights.keys(), ...targetManual.keys()]);

        for (const targetId of allTargets) {
            const autoWeight =
                (tagWeights.get(targetId) ?? 0) * TAG_WEIGHT_FACTOR +
                (viewWeights.get(targetId) ?? 0) * COVIEW_WEIGHT_FACTOR;
            const manual = targetManual.get(targetId);
            combined.set(targetId, manual !== undefined ? Math.max(manual, autoWeight) : autoWeight);
        }

        return [...combined.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([articleId, weight]) => ({ articleId, weight }));
    }

    @CreateRequestContext()
    async getEdges(articleId: string): Promise<ArticleEdge[]> {
        return this.em.find(ArticleEdge, { sourceId: articleId }, { orderBy: { weight: 'DESC' } });
    }

    @CreateRequestContext()
    async getAllEdges(): Promise<ArticleEdge[]> {
        return this.em.find(ArticleEdge, {}, { orderBy: { weight: 'DESC' } });
    }

    // ─── Internal ─────────────────────────────────────────────────────

    private async upsertEdge(sourceId: string, targetId: string, weight: number, edgeType: EdgeType): Promise<void> {
        const existing = await this.em.findOne(ArticleEdge, { sourceId, targetId, edgeType });
        if (existing) {
            existing.weight = weight;
            await this.em.flush();
        } else {
            const edge = this.em.create(ArticleEdge, { sourceId, targetId, weight, edgeType });
            await this.em.persistAndFlush(edge);
        }
    }
}
