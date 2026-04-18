import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { slugify, AddressValidationStatus } from '@asko/shared';
import {
    DeviceCategory,
    Device,
    Address,
    UserDevice,
    DealerProfile,
    DealerClient,
    Repairer,
    RepairRequest,
    Certificate,
    Review,
    WorkStep,
    BrokenPart,
    PointsTransaction,
    PointsWithdrawal,
    DevicePart,
    Vacation,
    SickLeave,
    Overtime,
    ScheduleOverride,
    WSchedulePattern,
} from '../entities';
import { DEV_USER_IDS } from './dev-ids';

const CATEGORIES = [
    { name: 'washing_machine', label: 'Стиральная машина',   labelPlural: 'Стиральные машины',   order: 1 },
    { name: 'oven',            label: 'Духовой шкаф',         labelPlural: 'Духовые шкафы',       order: 2 },
    { name: 'fridge',          label: 'Холодильник',          labelPlural: 'Холодильники',        order: 3 },
    { name: 'dishwasher',      label: 'Посудомоечная машина', labelPlural: 'Посудомоечные машины', order: 4 },
    { name: 'cooktop',         label: 'Варочная поверхность', labelPlural: 'Варочные поверхности', order: 5 },
    { name: 'other',           label: 'Другое',               labelPlural: 'Другое',              order: 99 },
];

const DEVICES: Array<{ category: string; name: string; brand: string; model: string; price: number }> = [
    { category: 'washing_machine', name: 'Стиральная машина W6098X.W', brand: 'ASKO', model: 'W6098X.W', price: 129900 },
    { category: 'washing_machine', name: 'Стиральная машина W4086R.W', brand: 'ASKO', model: 'W4086R.W', price: 94900 },
    { category: 'oven',            name: 'Духовой шкаф OP8687A',       brand: 'ASKO', model: 'OP8687A',  price: 149900 },
    { category: 'oven',            name: 'Духовой шкаф OP8478S',       brand: 'ASKO', model: 'OP8478S',  price: 109900 },
    { category: 'fridge',          name: 'Холодильник RF31831I',       brand: 'ASKO', model: 'RF31831I', price: 189900 },
    { category: 'fridge',          name: 'Холодильник R2282I',         brand: 'ASKO', model: 'R2282I',   price: 159900 },
    { category: 'dishwasher',      name: 'Посудомоечная машина DFI746MU', brand: 'ASKO', model: 'DFI746MU', price: 119900 },
    { category: 'dishwasher',      name: 'Посудомоечная машина DFI444B',  brand: 'ASKO', model: 'DFI444B',  price: 89900 },
    { category: 'cooktop',         name: 'Индукционная панель HI1655G', brand: 'ASKO', model: 'HI1655G',   price: 79900 },
];

export class DevSeeder extends Seeder {
    async run(em: EntityManager): Promise<void> {
        // Destructive wipe in FK-safe order.
        await em.nativeDelete(WorkStep, {});
        await em.nativeDelete(BrokenPart, {});
        await em.nativeDelete(Review, {});
        await em.nativeDelete(RepairRequest, {});
        await em.nativeDelete(Certificate, {});
        await em.nativeDelete(UserDevice, {});
        await em.nativeDelete(Address, {});
        await em.nativeDelete(DealerClient, {});
        await em.nativeDelete(PointsTransaction, {});
        await em.nativeDelete(PointsWithdrawal, {});
        await em.nativeDelete(DealerProfile, {});
        await em.nativeDelete(Repairer, {});
        await em.nativeDelete(Vacation, {});
        await em.nativeDelete(SickLeave, {});
        await em.nativeDelete(Overtime, {});
        await em.nativeDelete(ScheduleOverride, {});
        await em.nativeDelete(WSchedulePattern, {});
        await em.nativeDelete(DevicePart, {});
        await em.nativeDelete(Device, {});
        await em.nativeDelete(DeviceCategory, {});

        const now = new Date();

        // Categories
        const categoriesByName = new Map<string, DeviceCategory>();
        for (const c of CATEGORIES) {
            const entity = em.create(DeviceCategory, {
                name: c.name,
                label: c.label,
                labelPlural: c.labelPlural,
                order: c.order,
                createdAt: now,
                updatedAt: now,
            });
            categoriesByName.set(c.name, entity);
        }
        await em.flush();

        // Devices
        const deviceList: Device[] = [];
        for (const d of DEVICES) {
            const category = categoriesByName.get(d.category)!;
            const device = em.create(Device, {
                name: d.name,
                category,
                model: d.model,
                brand: d.brand,
                price: d.price,
                slug: slugify(`${d.brand}-${d.model}-${d.name}`),
                isFeatured: deviceList.length < 3,
                createdAt: now,
                updatedAt: now,
            });
            deviceList.push(device);
        }
        await em.flush();

        // Dealer profiles
        em.create(DealerProfile, {
            userId: DEV_USER_IDS.dealer1,
            companyName: 'ООО "РемонтПро"',
            inn: '7700000001',
            pointsBalance: 1500,
            createdAt: now,
            updatedAt: now,
        });
        em.create(DealerProfile, {
            userId: DEV_USER_IDS.dealer2,
            companyName: 'ИП Сервис+',
            inn: '7700000002',
            pointsBalance: 0,
            createdAt: now,
            updatedAt: now,
        });

        // Repairer profiles
        em.create(Repairer, {
            userId: DEV_USER_IDS.repairer1,
            city: 'Москва',
            specializations: ['washing_machine', 'dishwasher'],
            isActive: true,
            completedRepairs: 42,
            createdAt: now,
            updatedAt: now,
        });
        em.create(Repairer, {
            userId: DEV_USER_IDS.repairer2,
            city: 'Санкт-Петербург',
            specializations: ['fridge', 'oven'],
            isActive: true,
            completedRepairs: 17,
            createdAt: now,
            updatedAt: now,
        });

        // Addresses for regular users
        const addr1 = em.create(Address, {
            userId: DEV_USER_IDS.user1,
            city: 'Москва',
            street: 'Тверская',
            house: '10',
            apartment: '42',
            validationStatus: AddressValidationStatus.VALID,
            createdAt: now,
        });
        const addr2 = em.create(Address, {
            userId: DEV_USER_IDS.user2,
            city: 'Санкт-Петербург',
            street: 'Невский проспект',
            house: '25',
            apartment: '7',
            validationStatus: AddressValidationStatus.VALID,
            createdAt: now,
        });
        await em.flush();

        // User devices
        const userDevice1 = em.create(UserDevice, {
            userId: DEV_USER_IDS.user1,
            device: deviceList[0],
            serialNumber: 'SN-DEV-0001',
            address: addr1,
            purchaseDate: new Date('2025-01-15'),
            warrantyUntil: new Date('2027-01-15'),
            createdAt: now,
        });
        em.create(UserDevice, {
            userId: DEV_USER_IDS.user2,
            device: deviceList[4],
            serialNumber: 'SN-DEV-0002',
            address: addr2,
            purchaseDate: new Date('2025-03-01'),
            warrantyUntil: new Date('2027-03-01'),
            createdAt: now,
        });
        await em.flush();

        // One open repair request tied to user1's device so the admin UI has something to show.
        em.create(RepairRequest, {
            userId: DEV_USER_IDS.user1,
            userDevice: userDevice1,
            description: 'Машина не сливает воду после стирки',
            createdAt: now,
            updatedAt: now,
        });
        await em.flush();

        console.log(
            `[repair-service:DevSeeder] seeded ${CATEGORIES.length} categories, ${DEVICES.length} devices, ` +
            `2 dealers, 2 repairers, 2 addresses, 2 user devices, 1 repair request`,
        );
    }
}
