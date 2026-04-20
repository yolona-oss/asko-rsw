import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { Role, AuthProvider } from '@asko/shared';
import { User, UserSettings, Session, InvitationLink, UserAddress, UserOAuthLink, UserStatusHistory } from '../entities';
import { DEV_USER_IDS } from './dev-ids';
import CryptoService from '../services/crypto.service';

const TAG = '[user-service:DevSeeder]';
const DEV_PASSWORD = 'password123';

type SeedUser = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    roles: Role[];
};

const USERS: SeedUser[] = [
    { id: DEV_USER_IDS.superAdmin, firstName: 'Супер',    lastName: 'Админ',     email: 'superadmin@asko.dev', phone: '79000000001', roles: [Role.SUPER_ADMIN] },
    { id: DEV_USER_IDS.admin,      firstName: 'Админ',    lastName: 'Админов',   email: 'admin@asko.dev',      phone: '79000000002', roles: [Role.ADMIN] },
    { id: DEV_USER_IDS.dealer1,    firstName: 'Дилер',    lastName: 'Первый',    email: 'dealer1@asko.dev',    phone: '79000000003', roles: [Role.DEALER] },
    { id: DEV_USER_IDS.dealer2,    firstName: 'Дилер',    lastName: 'Второй',    email: 'dealer2@asko.dev',    phone: '79000000004', roles: [Role.DEALER] },
    { id: DEV_USER_IDS.manager1,   firstName: 'Менеджер', lastName: 'Первый',    email: 'manager1@asko.dev',   phone: '79000000005', roles: [Role.MANAGER] },
    { id: DEV_USER_IDS.manager2,   firstName: 'Менеджер', lastName: 'Второй',    email: 'manager2@asko.dev',   phone: '79000000006', roles: [Role.MANAGER] },
    { id: DEV_USER_IDS.repairer1,  firstName: 'Мастер',   lastName: 'Первый',    email: 'repairer1@asko.dev',  phone: '79000000007', roles: [Role.REPAIRER] },
    { id: DEV_USER_IDS.repairer2,  firstName: 'Мастер',   lastName: 'Второй',    email: 'repairer2@asko.dev',  phone: '79000000008', roles: [Role.REPAIRER] },
    { id: DEV_USER_IDS.user1,      firstName: 'Иван',     lastName: 'Иванов',    email: 'user1@asko.dev',      phone: '79000000009', roles: [Role.USER] },
    { id: DEV_USER_IDS.user2,      firstName: 'Петр',     lastName: 'Петров',    email: 'user2@asko.dev',      phone: '79000000010', roles: [Role.USER] },
    { id: DEV_USER_IDS.user3,      firstName: 'Мария',    lastName: 'Сидорова',  email: 'user3@asko.dev',      phone: '79000000011', roles: [Role.USER] },
    { id: DEV_USER_IDS.user4,      firstName: 'Алексей',  lastName: 'Козлов',    email: 'user4@asko.dev',      phone: '79000000012', roles: [Role.USER] },
];

export class DevSeeder extends Seeder {
    async run(em: EntityManager): Promise<void> {
        console.log(`${TAG} wiping tables...`);
        await em.nativeDelete(Session, {});
        await em.nativeDelete(InvitationLink, {});
        await em.nativeDelete(UserOAuthLink, {});
        await em.nativeDelete(UserAddress, {});
        await em.nativeDelete(UserStatusHistory, {});
        await em.nativeDelete(User, {});
        await em.nativeDelete(UserSettings, {});
        console.log(`${TAG}   cleared sessions, invitations, oauth links, addresses, status history, users, settings`);

        const passwordHash = await CryptoService.createPasswordHash(DEV_PASSWORD);
        const now = new Date();

        console.log(`${TAG} creating ${USERS.length} users...`);
        for (const u of USERS) {
            em.create(User, {
                id: u.id,
                firstName: u.firstName,
                lastName: u.lastName,
                email: u.email,
                phone: u.phone,
                passwordHash,
                roles: u.roles,
                providers: [AuthProvider.EMAIL],
                isActive: true,
                emailVerified: true,
                phoneVerified: true,
                settings: new UserSettings(),
                createdAt: now,
                updatedAt: now,
            });
            em.create(UserStatusHistory, {
                userId: u.id,
                isActive: true,
                changedBy: null,
                changedAt: now,
            });
        }
        await em.flush();

        for (const u of USERS) {
            const roleStr = u.roles.join(', ');
            console.log(`${TAG}   ${u.email.padEnd(24)} ${roleStr.padEnd(14)} ${u.id}`);
        }

        console.log(`${TAG} done: ${USERS.length} users, ${USERS.length} status history entries (password: ${DEV_PASSWORD})`);
    }
}
