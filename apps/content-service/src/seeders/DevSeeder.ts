import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { Article } from '../entities/article.entity';
import { ArticleView } from '../entities/article-view.entity';
import { ArticleEdge } from '../entities/article-edge.entity';
import { ArticleTag } from '../entities/article-tag.entity';

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

const ARTICLES = [
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
    },
];

export class DevSeeder extends Seeder {
    async run(em: EntityManager): Promise<void> {
        await em.nativeDelete(ArticleView, {});
        await em.nativeDelete(ArticleEdge, {});
        await em.nativeDelete(ArticleTag, {});
        await em.nativeDelete(Article, {});

        const now = new Date();
        for (const a of ARTICLES) {
            em.create(Article, {
                title: a.title,
                slug: a.slug,
                description: a.description,
                text: a.paragraphs.join('\n\n'),
                content: lexicalText(a.paragraphs),
                viewCount: a.viewCount,
                createdAt: now,
                updatedAt: now,
            });
        }

        await em.flush();
        console.log(`[content-service:DevSeeder] seeded ${ARTICLES.length} articles`);
    }
}
