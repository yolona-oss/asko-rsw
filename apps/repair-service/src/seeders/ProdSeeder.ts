import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { DeviceCategory } from '../entities';

const CATEGORIES = [
    { name: 'washing_machine', label: 'Стиральная машина',   labelPlural: 'Стиральные машины',   order: 1 },
    { name: 'oven',            label: 'Духовой шкаф',         labelPlural: 'Духовые шкафы',       order: 2 },
    { name: 'fridge',          label: 'Холодильник',          labelPlural: 'Холодильники',        order: 3 },
    { name: 'dishwasher',      label: 'Посудомоечная машина', labelPlural: 'Посудомоечные машины', order: 4 },
    { name: 'cooktop',         label: 'Варочная поверхность', labelPlural: 'Варочные поверхности', order: 5 },
    { name: 'other',           label: 'Другое',               labelPlural: 'Другое',              order: 99 },
];

export class ProdSeeder extends Seeder {
    async run(em: EntityManager): Promise<void> {
        let created = 0;
        const now = new Date();

        for (const c of CATEGORIES) {
            const existing = await em.findOne(DeviceCategory, { name: c.name });
            if (existing) continue;

            em.create(DeviceCategory, {
                name: c.name,
                label: c.label,
                labelPlural: c.labelPlural,
                order: c.order,
                createdAt: now,
                updatedAt: now,
            });
            created++;
        }

        await em.flush();
        console.log(`[repair-service:ProdSeeder] inserted ${created} new device categories (${CATEGORIES.length - created} already present)`);
    }
}
