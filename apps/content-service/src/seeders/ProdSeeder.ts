import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { Article } from '../entities/article.entity';

const WELCOME_SLUG = 'welcome-to-asko';

export class ProdSeeder extends Seeder {
    async run(em: EntityManager): Promise<void> {
        const existing = await em.findOne(Article, { slug: WELCOME_SLUG });
        if (existing) {
            console.log('[content-service:ProdSeeder] welcome article already exists — skipping');
            return;
        }

        const now = new Date();
        em.create(Article, {
            title: 'Добро пожаловать в ASKO',
            slug: WELCOME_SLUG,
            description: 'Официальный сервис ремонта бытовой техники ASKO.',
            text: 'Добро пожаловать. Здесь вы найдёте полезные материалы об эксплуатации и ремонте вашей техники.',
            viewCount: 0,
            createdAt: now,
            updatedAt: now,
        });

        await em.flush();
        console.log('[content-service:ProdSeeder] created welcome article');
    }
}
