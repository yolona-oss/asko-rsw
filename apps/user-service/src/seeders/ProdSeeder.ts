import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { Role, AuthProvider } from '@asko/shared';
import { User, UserSettings, UserStatusHistory } from '../entities';
import CryptoService from '../services/crypto.service';

export class ProdSeeder extends Seeder {
    async run(em: EntityManager): Promise<void> {
        const existing = await em.count(User, { roles: { $contains: [Role.SUPER_ADMIN] } });
        if (existing > 0) {
            console.log('[user-service:ProdSeeder] super admin already exists — skipping');
            return;
        }

        const name = process.env.SEED_ADMIN_NAME;
        const email = process.env.SEED_ADMIN_EMAIL;
        const phone = process.env.SEED_ADMIN_PHONE;
        const password = process.env.SEED_ADMIN_PASSWORD;

        if (!name || !email || !phone || !password) {
            throw new Error(
                '[user-service:ProdSeeder] SEED_ADMIN_NAME / SEED_ADMIN_EMAIL / SEED_ADMIN_PHONE / SEED_ADMIN_PASSWORD must all be set',
            );
        }

        const now = new Date();
        const user = em.create(User, {
            firstName: name,
            email,
            phone,
            passwordHash: await CryptoService.createPasswordHash(password),
            roles: [Role.SUPER_ADMIN],
            providers: [AuthProvider.EMAIL],
            isActive: true,
            emailVerified: true,
            phoneVerified: true,
            settings: new UserSettings(),
            createdAt: now,
            updatedAt: now,
        });
        em.create(UserStatusHistory, {
            userId: user.id,
            isActive: true,
            changedBy: null,
            changedAt: now,
        });

        await em.flush();
        console.log(`[user-service:ProdSeeder] created super admin ${email}`);
    }
}
