import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { Article } from '../entities/article.entity';
import { ArticleView } from '../entities/article-view.entity';
import { ArticleEdge, EdgeType } from '../entities/article-edge.entity';
import { ArticleTag } from '../entities/article-tag.entity';

const TAG = '[content-service:DevSeeder]';

const lexicalText = (paragraphs: string[]): Record<string, any> => ({
    root: {
        children: paragraphs.map((p) => ({
            children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: p, type: 'text', version: 1 }],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
        })),
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
    },
});

type ArticleSeed = {
    title: string;
    slug: string;
    description: string;
    paragraphs: string[];
    viewCount: number;
    tags: string[];
};

const ARTICLES: ArticleSeed[] = [
    {
        title: 'Как продлить срок службы стиральной машины',
        slug: 'washing-machine-longevity',
        description: 'Простые правила ухода, которые помогут избежать ремонта.',
        paragraphs: [
            'Регулярно чистите фильтр сливного насоса — это одна из самых частых причин поломок.',
            'Не перегружайте барабан: избыточный вес ускоряет износ подшипников.',
            'Раз в несколько месяцев запускайте пустую стирку с лимонной кислотой для удаления накипи.',
        ],
        viewCount: 120,
        tags: ['стиральная машина', 'уход', 'профилактика'],
    },
    {
        title: 'Признаки неисправности холодильника',
        slug: 'fridge-troubleshooting',
        description: 'На что обратить внимание до вызова мастера.',
        paragraphs: [
            'Если холодильник стал работать громче обычного, это может указывать на проблему с компрессором.',
            'Обратите внимание на намерзание льда в морозильной камере — это может быть признаком неисправности системы No Frost.',
        ],
        viewCount: 86,
        tags: ['холодильник', 'диагностика', 'неисправности'],
    },
    {
        title: 'Когда нужен сертифицированный ремонт',
        slug: 'certified-repair-importance',
        description: 'Гарантия и сертификация — зачем они нужны.',
        paragraphs: [
            'Сертифицированный ремонт сохраняет гарантию производителя.',
            'Использование оригинальных запчастей продлевает срок службы техники.',
        ],
        viewCount: 45,
        tags: ['ремонт', 'гарантия', 'сертификат'],
    },
    {
        title: 'Духовой шкаф: частые поломки и их профилактика',
        slug: 'oven-common-issues',
        description: 'Обзор типичных неисправностей духовых шкафов и советы по уходу.',
        paragraphs: [
            'Перегорание ТЭНа — одна из самых частых причин обращения в сервис. Не используйте режим максимального нагрева без необходимости.',
            'Неисправность термодатчика может привести к недогреву или перегреву. Если температура явно не соответствует выставленной — обратитесь к мастеру.',
            'Регулярно очищайте духовку от жировых отложений — они могут повлиять на равномерность нагрева и работу вентилятора.',
        ],
        viewCount: 67,
        tags: ['духовой шкаф', 'поломки', 'профилактика', 'уход'],
    },
    {
        title: 'Посудомоечная машина: как избежать протечек',
        slug: 'dishwasher-leak-prevention',
        description: 'Распространённые причины протечек и способы их предотвращения.',
        paragraphs: [
            'Проверяйте состояние уплотнителя дверцы — со временем он теряет эластичность и начинает пропускать воду.',
            'Не перегружайте корзины и следите за правильной укладкой посуды — это влияет на работу разбрызгивателей.',
            'Используйте только рекомендованные средства: неподходящее моющее может вызвать избыточное пенообразование и протечку.',
        ],
        viewCount: 53,
        tags: ['посудомоечная машина', 'протечка', 'профилактика'],
    },
];

// Edges describe weighted relationships between articles
const ARTICLE_EDGES: Array<{ sourceSlug: string; targetSlug: string; weight: number; edgeType: EdgeType }> = [
    { sourceSlug: 'washing-machine-longevity',   targetSlug: 'certified-repair-importance', weight: 0.7, edgeType: EdgeType.TAG },
    { sourceSlug: 'fridge-troubleshooting',      targetSlug: 'certified-repair-importance', weight: 0.6, edgeType: EdgeType.TAG },
    { sourceSlug: 'oven-common-issues',          targetSlug: 'certified-repair-importance', weight: 0.65, edgeType: EdgeType.TAG },
    { sourceSlug: 'dishwasher-leak-prevention',  targetSlug: 'washing-machine-longevity',   weight: 0.5, edgeType: EdgeType.TAG },
    { sourceSlug: 'oven-common-issues',          targetSlug: 'fridge-troubleshooting',      weight: 0.3, edgeType: EdgeType.MANUAL },
    { sourceSlug: 'dishwasher-leak-prevention',  targetSlug: 'oven-common-issues',          weight: 0.4, edgeType: EdgeType.TAG },
];

// Simulated view sessions — creates ArticleView entries for analytics
const FAKE_SESSIONS = [
    'sess-dev-001', 'sess-dev-002', 'sess-dev-003',
    'sess-dev-004', 'sess-dev-005', 'sess-dev-006',
    'sess-dev-007', 'sess-dev-008',
];

const DEV_USER_IDS_CONTENT = {
    user1: '00000000-0000-4000-8000-000000000009',
    user2: '00000000-0000-4000-8000-00000000000a',
    user3: '00000000-0000-4000-8000-00000000000b',
};

export class DevSeeder extends Seeder {
    async run(em: EntityManager): Promise<void> {
        // ── 1. Wipe ──────────────────────────────────────────────────────
        console.log(`${TAG} wiping tables...`);
        await em.nativeDelete(ArticleView, {});
        await em.nativeDelete(ArticleEdge, {});
        await em.nativeDelete(ArticleTag, {});
        await em.nativeDelete(Article, {});
        console.log(`${TAG}   cleared views, edges, tags, articles`);

        const now = new Date();

        // ── 2. Articles ─────────────────────────────────────────────────
        const articleMap = new Map<string, Article>();
        for (const a of ARTICLES) {
            const article = em.create(Article, {
                title: a.title,
                slug: a.slug,
                description: a.description,
                text: a.paragraphs.join('\n\n'),
                content: lexicalText(a.paragraphs),
                viewCount: a.viewCount,
                createdAt: now,
                updatedAt: now,
            });
            articleMap.set(a.slug, article);
        }
        await em.flush();
        console.log(`${TAG} articles: ${ARTICLES.length} created`);
        for (const a of ARTICLES) {
            const article = articleMap.get(a.slug)!;
            console.log(`${TAG}   ${a.slug.padEnd(32)} views: ${String(a.viewCount).padStart(4)}   ${article.id}`);
        }

        // ── 3. Tags ─────────────────────────────────────────────────────
        let tagCount = 0;
        for (const a of ARTICLES) {
            const article = articleMap.get(a.slug)!;
            for (const tag of a.tags) {
                em.create(ArticleTag, {
                    articleId: article.id,
                    tag,
                    createdAt: now,
                });
                tagCount++;
            }
        }
        await em.flush();
        console.log(`${TAG} tags: ${tagCount} created`);
        for (const a of ARTICLES) {
            console.log(`${TAG}   ${a.slug.padEnd(32)} [${a.tags.join(', ')}]`);
        }

        // ── 4. Edges ────────────────────────────────────────────────────
        for (const e of ARTICLE_EDGES) {
            const source = articleMap.get(e.sourceSlug)!;
            const target = articleMap.get(e.targetSlug)!;
            em.create(ArticleEdge, {
                sourceId: source.id,
                targetId: target.id,
                weight: e.weight,
                edgeType: e.edgeType,
                createdAt: now,
                updatedAt: now,
            });
        }
        await em.flush();
        console.log(`${TAG} edges: ${ARTICLE_EDGES.length} created`);
        for (const e of ARTICLE_EDGES) {
            console.log(`${TAG}   ${e.sourceSlug.padEnd(32)} → ${e.targetSlug.padEnd(32)} w=${e.weight} (${e.edgeType})`);
        }

        // ── 5. Views ────────────────────────────────────────────────────
        const viewData: Array<{ articleSlug: string; userId?: string; sessionId: string; daysAgo: number }> = [
            // user1 browsed several articles
            { articleSlug: 'washing-machine-longevity',  userId: DEV_USER_IDS_CONTENT.user1, sessionId: FAKE_SESSIONS[0], daysAgo: 5 },
            { articleSlug: 'certified-repair-importance', userId: DEV_USER_IDS_CONTENT.user1, sessionId: FAKE_SESSIONS[0], daysAgo: 5 },
            { articleSlug: 'oven-common-issues',          userId: DEV_USER_IDS_CONTENT.user1, sessionId: FAKE_SESSIONS[1], daysAgo: 3 },
            // user2 browsed fridge article
            { articleSlug: 'fridge-troubleshooting',      userId: DEV_USER_IDS_CONTENT.user2, sessionId: FAKE_SESSIONS[2], daysAgo: 4 },
            { articleSlug: 'certified-repair-importance', userId: DEV_USER_IDS_CONTENT.user2, sessionId: FAKE_SESSIONS[2], daysAgo: 4 },
            // user3 browsed dishwasher article
            { articleSlug: 'dishwasher-leak-prevention',  userId: DEV_USER_IDS_CONTENT.user3, sessionId: FAKE_SESSIONS[3], daysAgo: 2 },
            // anonymous views
            { articleSlug: 'washing-machine-longevity',  sessionId: FAKE_SESSIONS[4], daysAgo: 7 },
            { articleSlug: 'washing-machine-longevity',  sessionId: FAKE_SESSIONS[5], daysAgo: 6 },
            { articleSlug: 'fridge-troubleshooting',     sessionId: FAKE_SESSIONS[6], daysAgo: 1 },
            { articleSlug: 'oven-common-issues',         sessionId: FAKE_SESSIONS[7], daysAgo: 1 },
        ];
        for (const v of viewData) {
            const article = articleMap.get(v.articleSlug)!;
            em.create(ArticleView, {
                articleId: article.id,
                userId: v.userId,
                sessionId: v.sessionId,
                viewedAt: new Date(now.getTime() - v.daysAgo * 86_400_000),
            });
        }
        await em.flush();
        const authViews = viewData.filter((v) => v.userId).length;
        const anonViews = viewData.length - authViews;
        console.log(`${TAG} views: ${viewData.length} created (${authViews} authenticated, ${anonViews} anonymous)`);

        // ── Summary ─────────────────────────────────────────────────────
        console.log(`${TAG} ───────────────────────────────────────`);
        console.log(`${TAG} done: ${ARTICLES.length} articles, ${tagCount} tags, ${ARTICLE_EDGES.length} edges, ${viewData.length} views`);
    }
}
