import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import {
    slugify,
    AddressValidationStatus,
    RepairRequestStatus,
    WorkStepStatus,
    BrokenPartStatus,
    CertificateStatus,
    PointsTransactionType,
} from '@asko/shared';
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
    ScheduleStatus,
    WSchedulePattern,
} from '../entities';
import { DEV_USER_IDS } from './dev-ids';

const TAG = '[repair-service:DevSeeder]';

// ── Static data ──────────────────────────────────────────────────────────

const CATEGORIES = [
    { name: 'washing_machine', label: 'Стиральная машина',   labelPlural: 'Стиральные машины',    order: 1 },
    { name: 'oven',            label: 'Духовой шкаф',         labelPlural: 'Духовые шкафы',        order: 2 },
    { name: 'fridge',          label: 'Холодильник',          labelPlural: 'Холодильники',         order: 3 },
    { name: 'dishwasher',      label: 'Посудомоечная машина', labelPlural: 'Посудомоечные машины', order: 4 },
    { name: 'cooktop',         label: 'Варочная поверхность', labelPlural: 'Варочные поверхности', order: 5 },
    { name: 'other',           label: 'Другое',               labelPlural: 'Другое',              order: 99 },
];

const DEVICES: Array<{ category: string; name: string; brand: string; model: string; price: number }> = [
    { category: 'washing_machine', name: 'Стиральная машина W6098X.W',    brand: 'ASKO', model: 'W6098X.W',   price: 129900 },
    { category: 'washing_machine', name: 'Стиральная машина W4086R.W',    brand: 'ASKO', model: 'W4086R.W',   price: 94900 },
    { category: 'oven',            name: 'Духовой шкаф OP8687A',          brand: 'ASKO', model: 'OP8687A',    price: 149900 },
    { category: 'oven',            name: 'Духовой шкаф OP8478S',          brand: 'ASKO', model: 'OP8478S',    price: 109900 },
    { category: 'fridge',          name: 'Холодильник RF31831I',          brand: 'ASKO', model: 'RF31831I',   price: 189900 },
    { category: 'fridge',          name: 'Холодильник R2282I',            brand: 'ASKO', model: 'R2282I',     price: 159900 },
    { category: 'dishwasher',      name: 'Посудомоечная машина DFI746MU', brand: 'ASKO', model: 'DFI746MU',   price: 119900 },
    { category: 'dishwasher',      name: 'Посудомоечная машина DFI444B',  brand: 'ASKO', model: 'DFI444B',    price: 89900 },
    { category: 'cooktop',         name: 'Индукционная панель HI1655G',   brand: 'ASKO', model: 'HI1655G',    price: 79900 },
];

const DEVICE_PARTS: Array<{ deviceIndex: number; group: string; name: string; partNumber: string; price: number }> = [
    { deviceIndex: 0, group: 'Насос',        name: 'Сливной насос',          partNumber: 'ASKO-W6098-P01', price: 4500 },
    { deviceIndex: 0, group: 'Насос',        name: 'Заливной клапан',        partNumber: 'ASKO-W6098-P02', price: 3200 },
    { deviceIndex: 0, group: 'Подшипник',    name: 'Подшипник барабана',     partNumber: 'ASKO-W6098-P03', price: 2800 },
    { deviceIndex: 0, group: 'Электроника', name: 'Плата управления',       partNumber: 'ASKO-W6098-P04', price: 12500 },
    { deviceIndex: 2, group: 'Нагрев',      name: 'ТЭН верхний',            partNumber: 'ASKO-OP8687-P01', price: 5600 },
    { deviceIndex: 2, group: 'Нагрев',      name: 'Термодатчик',            partNumber: 'ASKO-OP8687-P02', price: 1800 },
    { deviceIndex: 4, group: 'Компрессор',   name: 'Компрессор',             partNumber: 'ASKO-RF318-P01',  price: 18500 },
    { deviceIndex: 4, group: 'Система',      name: 'Вентилятор No Frost',    partNumber: 'ASKO-RF318-P02',  price: 3900 },
    { deviceIndex: 4, group: 'Система',      name: 'Датчик температуры',     partNumber: 'ASKO-RF318-P03',  price: 1500 },
    { deviceIndex: 6, group: 'Разбрызгиватель', name: 'Верхний разбрызгиватель', partNumber: 'ASKO-DFI746-P01', price: 2200 },
    { deviceIndex: 6, group: 'Насос',        name: 'Циркуляционный насос',   partNumber: 'ASKO-DFI746-P02', price: 6800 },
    { deviceIndex: 8, group: 'Электроника', name: 'Индукционный модуль',    partNumber: 'ASKO-HI165-P01',  price: 14200 },
];

export class DevSeeder extends Seeder {
    async run(em: EntityManager): Promise<void> {
        const now = new Date();

        // ── 1. Wipe ──────────────────────────────────────────────────────
        console.log(`${TAG} wiping tables...`);
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
        console.log(`${TAG}   cleared all tables`);

        // ── 2. Categories ────────────────────────────────────────────────
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
        console.log(`${TAG} categories: ${CATEGORIES.length} created`);
        for (const c of CATEGORIES) {
            console.log(`${TAG}   ${c.name.padEnd(18)} ${c.label}`);
        }

        // ── 3. Devices ──────────────────────────────────────────────────
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
        console.log(`${TAG} devices: ${DEVICES.length} created`);
        for (const d of deviceList) {
            console.log(`${TAG}   ${d.brand} ${d.model!.padEnd(12)} ${(d.price! / 100).toFixed(0).padStart(6)} руб   ${d.id}`);
        }

        // ── 4. Device parts ─────────────────────────────────────────────
        const partList: DevicePart[] = [];
        for (const p of DEVICE_PARTS) {
            const device = deviceList[p.deviceIndex];
            const part = em.create(DevicePart, {
                device,
                category: device.category,
                group: p.group,
                name: p.name,
                partNumber: p.partNumber,
                price: p.price,
                createdAt: now,
                updatedAt: now,
            });
            partList.push(part);
        }
        await em.flush();
        console.log(`${TAG} device parts: ${DEVICE_PARTS.length} created`);
        for (const p of partList) {
            console.log(`${TAG}   ${p.partNumber!.padEnd(20)} ${p.name.padEnd(28)} ${(p.price! / 100).toFixed(0).padStart(6)} руб`);
        }

        // ── 5. Dealers ──────────────────────────────────────────────────
        const dealer1 = em.create(DealerProfile, {
            userId: DEV_USER_IDS.dealer1,
            companyName: 'ООО "РемонтПро"',
            inn: '7700000001',
            pointsBalance: 1500,
            createdAt: now,
            updatedAt: now,
        });
        const dealer2 = em.create(DealerProfile, {
            userId: DEV_USER_IDS.dealer2,
            companyName: 'ИП Сервис+',
            inn: '7700000002',
            pointsBalance: 300,
            createdAt: now,
            updatedAt: now,
        });
        await em.flush();
        console.log(`${TAG} dealers: 2 created`);
        console.log(`${TAG}   ${dealer1.companyName!.padEnd(20)} ИНН ${dealer1.inn}   баланс: ${dealer1.pointsBalance} pts`);
        console.log(`${TAG}   ${dealer2.companyName!.padEnd(20)} ИНН ${dealer2.inn}   баланс: ${dealer2.pointsBalance} pts`);

        // ── 6. Dealer clients ───────────────────────────────────────────
        em.create(DealerClient, { dealer: dealer1, clientUserId: DEV_USER_IDS.user1, createdAt: now });
        em.create(DealerClient, { dealer: dealer1, clientUserId: DEV_USER_IDS.user2, createdAt: now });
        em.create(DealerClient, { dealer: dealer2, clientUserId: DEV_USER_IDS.user3, createdAt: now });
        await em.flush();
        console.log(`${TAG} dealer clients: 3 created (dealer1→user1,user2 / dealer2→user3)`);

        // ── 7. Repairers ────────────────────────────────────────────────
        const repairer1 = em.create(Repairer, {
            userId: DEV_USER_IDS.repairer1,
            city: 'Москва',
            timezone: 'Europe/Moscow',
            specializations: ['washing_machine', 'dishwasher'],
            isActive: true,
            completedRepairs: 42,
            createdAt: now,
            updatedAt: now,
        });
        const repairer2 = em.create(Repairer, {
            userId: DEV_USER_IDS.repairer2,
            city: 'Санкт-Петербург',
            timezone: 'Europe/Moscow',
            specializations: ['fridge', 'oven'],
            isActive: true,
            completedRepairs: 17,
            createdAt: now,
            updatedAt: now,
        });
        await em.flush();
        console.log(`${TAG} repairers: 2 created`);
        console.log(`${TAG}   repairer1  ${repairer1.city.padEnd(20)} specs: ${repairer1.specializations.join(', ')}   done: ${repairer1.completedRepairs}`);
        console.log(`${TAG}   repairer2  ${repairer2.city.padEnd(20)} specs: ${repairer2.specializations.join(', ')}   done: ${repairer2.completedRepairs}`);

        // ── 8. Addresses ────────────────────────────────────────────────
        const addr1 = em.create(Address, {
            userId: DEV_USER_IDS.user1,
            city: 'Москва',
            street: 'Тверская',
            house: '10',
            apartment: '42',
            entrance: '2',
            floor: '5',
            latitude: 55.763,
            longitude: 37.606,
            timezone: 'Europe/Moscow',
            isPrimary: true,
            validationStatus: AddressValidationStatus.VALID,
            createdAt: now,
        });
        const addr2 = em.create(Address, {
            userId: DEV_USER_IDS.user2,
            city: 'Санкт-Петербург',
            street: 'Невский проспект',
            house: '25',
            apartment: '7',
            entrance: '1',
            floor: '3',
            latitude: 59.935,
            longitude: 30.327,
            timezone: 'Europe/Moscow',
            isPrimary: true,
            validationStatus: AddressValidationStatus.VALID,
            createdAt: now,
        });
        const addr3 = em.create(Address, {
            userId: DEV_USER_IDS.user3,
            city: 'Москва',
            street: 'Арбат',
            house: '15',
            apartment: '12',
            latitude: 55.752,
            longitude: 37.593,
            timezone: 'Europe/Moscow',
            isPrimary: true,
            validationStatus: AddressValidationStatus.VALID,
            createdAt: now,
        });
        const addr4 = em.create(Address, {
            userId: DEV_USER_IDS.user4,
            city: 'Москва',
            street: 'Ленинский проспект',
            house: '47',
            apartment: '101',
            latitude: 55.706,
            longitude: 37.577,
            timezone: 'Europe/Moscow',
            isPrimary: true,
            validationStatus: AddressValidationStatus.VALID,
            createdAt: now,
        });
        await em.flush();
        console.log(`${TAG} addresses: 4 created`);
        console.log(`${TAG}   user1  ${addr1.city}, ${addr1.street} ${addr1.house}`);
        console.log(`${TAG}   user2  ${addr2.city}, ${addr2.street} ${addr2.house}`);
        console.log(`${TAG}   user3  ${addr3.city}, ${addr3.street} ${addr3.house}`);
        console.log(`${TAG}   user4  ${addr4.city}, ${addr4.street} ${addr4.house}`);

        // ── 9. User devices ─────────────────────────────────────────────
        const userDevice1 = em.create(UserDevice, {
            userId: DEV_USER_IDS.user1,
            device: deviceList[0], // W6098X.W
            serialNumber: 'SN-DEV-0001',
            address: addr1,
            purchaseDate: new Date('2025-01-15'),
            warrantyUntil: new Date('2027-01-15'),
            createdAt: now,
        });
        const userDevice2 = em.create(UserDevice, {
            userId: DEV_USER_IDS.user2,
            device: deviceList[4], // RF31831I
            serialNumber: 'SN-DEV-0002',
            address: addr2,
            purchaseDate: new Date('2025-03-01'),
            warrantyUntil: new Date('2027-03-01'),
            createdAt: now,
        });
        const userDevice3 = em.create(UserDevice, {
            userId: DEV_USER_IDS.user3,
            device: deviceList[6], // DFI746MU
            serialNumber: 'SN-DEV-0003',
            address: addr3,
            purchaseDate: new Date('2025-06-10'),
            warrantyUntil: new Date('2027-06-10'),
            createdAt: now,
        });
        const userDevice4 = em.create(UserDevice, {
            userId: DEV_USER_IDS.user1,
            device: deviceList[2], // OP8687A
            serialNumber: 'SN-DEV-0004',
            address: addr1,
            purchaseDate: new Date('2024-11-20'),
            warrantyUntil: new Date('2026-11-20'),
            createdAt: now,
        });
        const userDevice5 = em.create(UserDevice, {
            userId: DEV_USER_IDS.user4,
            device: deviceList[8], // HI1655G
            serialNumber: 'SN-DEV-0005',
            address: addr4,
            purchaseDate: new Date('2025-09-05'),
            warrantyUntil: new Date('2027-09-05'),
            createdAt: now,
        });
        await em.flush();
        console.log(`${TAG} user devices: 5 created`);
        console.log(`${TAG}   user1  ${deviceList[0].model} (SN-DEV-0001) + ${deviceList[2].model} (SN-DEV-0004)`);
        console.log(`${TAG}   user2  ${deviceList[4].model} (SN-DEV-0002)`);
        console.log(`${TAG}   user3  ${deviceList[6].model} (SN-DEV-0003)`);
        console.log(`${TAG}   user4  ${deviceList[8].model} (SN-DEV-0005)`);

        // ── 10. Certificates ────────────────────────────────────────────
        const cert1 = em.create(Certificate, {
            certificateNumber: 'CERT-DEV-0001',
            userId: DEV_USER_IDS.user1,
            userDevice: userDevice1,
            dealer: dealer1,
            status: CertificateStatus.ACTIVE,
            issuedAt: new Date('2025-02-01'),
            expiresAt: new Date('2027-02-01'),
            price: 15000,
            paid: true,
            pointsAwarded: true,
            description: 'Сертификат расширенной гарантии на стиральную машину',
            createdAt: now,
        });
        const cert2 = em.create(Certificate, {
            certificateNumber: 'CERT-DEV-0002',
            userId: DEV_USER_IDS.user2,
            userDevice: userDevice2,
            status: CertificateStatus.PENDING_PAYMENT,
            issuedAt: now,
            expiresAt: new Date('2028-04-20'),
            price: 18000,
            paid: false,
            description: 'Сертификат расширенной гарантии на холодильник',
            createdAt: now,
        });
        const cert3 = em.create(Certificate, {
            certificateNumber: 'CERT-DEV-0003',
            userId: DEV_USER_IDS.user3,
            userDevice: userDevice3,
            dealer: dealer2,
            status: CertificateStatus.ACTIVE,
            issuedAt: new Date('2025-07-01'),
            expiresAt: new Date('2027-07-01'),
            price: 12000,
            paid: true,
            pointsAwarded: true,
            description: 'Сертификат расширенной гарантии на посудомоечную машину',
            createdAt: now,
        });
        await em.flush();
        console.log(`${TAG} certificates: 3 created`);
        console.log(`${TAG}   ${cert1.certificateNumber}  user1  ${cert1.status.padEnd(18)} до ${cert1.expiresAt.toISOString().slice(0, 10)}`);
        console.log(`${TAG}   ${cert2.certificateNumber}  user2  ${cert2.status.padEnd(18)} до ${cert2.expiresAt.toISOString().slice(0, 10)}`);
        console.log(`${TAG}   ${cert3.certificateNumber}  user3  ${cert3.status.padEnd(18)} до ${cert3.expiresAt.toISOString().slice(0, 10)}`);

        // ── 11. Repair requests ─────────────────────────────────────────
        // RR1: PENDING — user1, washing machine won't drain
        em.create(RepairRequest, {
            userId: DEV_USER_IDS.user1,
            userDevice: userDevice1,
            address: addr1,
            description: 'Машина не сливает воду после стирки',
            status: RepairRequestStatus.PENDING,
            certificate: cert1,
            certificateValid: true,
            createdAt: now,
            updatedAt: now,
        });

        // RR2: ASSIGNED — user2, fridge too loud, assigned to repairer2
        em.create(RepairRequest, {
            userId: DEV_USER_IDS.user2,
            userDevice: userDevice2,
            repairer: repairer2,
            managerId: DEV_USER_IDS.manager1,
            address: addr2,
            description: 'Холодильник стал громко работать, слышен посторонний гул',
            status: RepairRequestStatus.ASSIGNED,
            preferredDate: new Date(now.getTime() + 3 * 86_400_000),
            createdAt: new Date(now.getTime() - 2 * 86_400_000),
            updatedAt: now,
        });

        // RR3: IN_PROGRESS — user3, dishwasher leak, repairer1 working on it
        const rr3 = em.create(RepairRequest, {
            userId: DEV_USER_IDS.user3,
            userDevice: userDevice3,
            repairer: repairer1,
            managerId: DEV_USER_IDS.manager1,
            address: addr3,
            description: 'Посудомоечная машина протекает снизу во время мойки',
            status: RepairRequestStatus.IN_PROGRESS,
            certificate: cert3,
            certificateValid: true,
            stepsLocked: true,
            createdAt: new Date(now.getTime() - 5 * 86_400_000),
            updatedAt: now,
        });

        // RR4: COMPLETED — user1, oven thermostat fix, done by repairer1
        const rr4 = em.create(RepairRequest, {
            userId: DEV_USER_IDS.user1,
            userDevice: userDevice4,
            repairer: repairer1,
            managerId: DEV_USER_IDS.manager2,
            address: addr1,
            description: 'Духовой шкаф не набирает температуру выше 150°C',
            status: RepairRequestStatus.COMPLETED,
            totalCost: 7400,
            completionNote: 'Заменён верхний ТЭН и термодатчик. Проверено — температура набирается корректно.',
            createdAt: new Date(now.getTime() - 14 * 86_400_000),
            updatedAt: new Date(now.getTime() - 7 * 86_400_000),
        });

        // RR5: CANCELLED — user4, cooktop issue cancelled by user
        em.create(RepairRequest, {
            userId: DEV_USER_IDS.user4,
            userDevice: userDevice5,
            address: addr4,
            description: 'Левая конфорка не включается',
            status: RepairRequestStatus.CANCELLED,
            refuseReason: 'Решил обратиться позже',
            createdAt: new Date(now.getTime() - 10 * 86_400_000),
            updatedAt: new Date(now.getTime() - 9 * 86_400_000),
        });

        // RR6: AWAITING_COMPLETION — user2 second device (via dealer), repairer2 finished work
        const userDevice2b = em.create(UserDevice, {
            userId: DEV_USER_IDS.user2,
            device: deviceList[3], // OP8478S
            serialNumber: 'SN-DEV-0006',
            address: addr2,
            purchaseDate: new Date('2025-05-12'),
            warrantyUntil: new Date('2027-05-12'),
            createdAt: now,
        });
        await em.flush();

        const rr6 = em.create(RepairRequest, {
            userId: DEV_USER_IDS.user2,
            userDevice: userDevice2b,
            repairer: repairer2,
            managerId: DEV_USER_IDS.manager2,
            address: addr2,
            description: 'Духовой шкаф не реагирует на кнопки панели управления',
            status: RepairRequestStatus.AWAITING_COMPLETION,
            totalCost: 12500,
            completionNote: 'Заменена плата управления. Все кнопки работают.',
            createdAt: new Date(now.getTime() - 8 * 86_400_000),
            updatedAt: new Date(now.getTime() - 1 * 86_400_000),
        });

        await em.flush();
        console.log(`${TAG} repair requests: 6 created`);
        console.log(`${TAG}   RR1  user1  ${RepairRequestStatus.PENDING.padEnd(22)} стиральная машина — не сливает воду`);
        console.log(`${TAG}   RR2  user2  ${RepairRequestStatus.ASSIGNED.padEnd(22)} холодильник — посторонний гул`);
        console.log(`${TAG}   RR3  user3  ${RepairRequestStatus.IN_PROGRESS.padEnd(22)} посудомойка — протечка`);
        console.log(`${TAG}   RR4  user1  ${RepairRequestStatus.COMPLETED.padEnd(22)} духовой шкаф — не набирает температуру`);
        console.log(`${TAG}   RR5  user4  ${RepairRequestStatus.CANCELLED.padEnd(22)} варочная панель — не включается конфорка`);
        console.log(`${TAG}   RR6  user2  ${RepairRequestStatus.AWAITING_COMPLETION.padEnd(22)} духовой шкаф — не реагирует на кнопки`);

        // ── 12. Work steps ──────────────────────────────────────────────
        // RR3 (IN_PROGRESS): 4 steps — 2 done, 1 in progress, 1 pending
        em.create(WorkStep, {
            repairRequest: rr3,
            title: 'Диагностика',
            description: 'Осмотр и определение причины протечки',
            status: WorkStepStatus.COMPLETED,
            order: 1,
            isMandatory: true,
            completedByRepairerId: repairer1.id,
            createdAt: now,
            updatedAt: now,
        });
        em.create(WorkStep, {
            repairRequest: rr3,
            title: 'Заказ запчастей',
            description: 'Заказ уплотнителя дверцы и разбрызгивателя',
            status: WorkStepStatus.COMPLETED,
            order: 2,
            completedByRepairerId: repairer1.id,
            createdAt: now,
            updatedAt: now,
        });
        em.create(WorkStep, {
            repairRequest: rr3,
            title: 'Замена уплотнителя',
            description: 'Замена уплотнительной резинки дверцы',
            status: WorkStepStatus.IN_PROGRESS,
            order: 3,
            isMandatory: true,
            createdAt: now,
            updatedAt: now,
        });
        em.create(WorkStep, {
            repairRequest: rr3,
            title: 'Финальная проверка',
            description: 'Запуск тестовой мойки, проверка отсутствия протечек',
            status: WorkStepStatus.PENDING,
            order: 4,
            isFinal: true,
            isMandatory: true,
            createdAt: now,
            updatedAt: now,
        });

        // RR4 (COMPLETED): 3 steps — all completed
        em.create(WorkStep, {
            repairRequest: rr4,
            title: 'Диагностика',
            description: 'Проверка нагревательных элементов и датчиков',
            status: WorkStepStatus.COMPLETED,
            order: 1,
            isMandatory: true,
            completedByRepairerId: repairer1.id,
            createdAt: new Date(now.getTime() - 12 * 86_400_000),
            updatedAt: new Date(now.getTime() - 12 * 86_400_000),
        });
        em.create(WorkStep, {
            repairRequest: rr4,
            title: 'Замена ТЭН и термодатчика',
            description: 'Демонтаж старого ТЭН, установка нового ТЭН и термодатчика',
            status: WorkStepStatus.COMPLETED,
            order: 2,
            isMandatory: true,
            completedByRepairerId: repairer1.id,
            createdAt: new Date(now.getTime() - 10 * 86_400_000),
            updatedAt: new Date(now.getTime() - 8 * 86_400_000),
        });
        em.create(WorkStep, {
            repairRequest: rr4,
            title: 'Проверка работы',
            description: 'Тестовый нагрев до 200°C, контроль температуры',
            status: WorkStepStatus.COMPLETED,
            order: 3,
            isFinal: true,
            isMandatory: true,
            completedByRepairerId: repairer1.id,
            createdAt: new Date(now.getTime() - 8 * 86_400_000),
            updatedAt: new Date(now.getTime() - 7 * 86_400_000),
        });

        // RR6 (AWAITING_COMPLETION): 2 steps — all completed
        em.create(WorkStep, {
            repairRequest: rr6,
            title: 'Диагностика платы управления',
            description: 'Проверка электронных компонентов платы',
            status: WorkStepStatus.COMPLETED,
            order: 1,
            isMandatory: true,
            completedByRepairerId: repairer2.id,
            createdAt: new Date(now.getTime() - 5 * 86_400_000),
            updatedAt: new Date(now.getTime() - 4 * 86_400_000),
        });
        em.create(WorkStep, {
            repairRequest: rr6,
            title: 'Замена платы управления',
            description: 'Установка новой платы, калибровка',
            status: WorkStepStatus.COMPLETED,
            order: 2,
            isFinal: true,
            isMandatory: true,
            completedByRepairerId: repairer2.id,
            createdAt: new Date(now.getTime() - 3 * 86_400_000),
            updatedAt: new Date(now.getTime() - 1 * 86_400_000),
        });

        await em.flush();
        console.log(`${TAG} work steps: 9 created (RR3: 4, RR4: 3, RR6: 2)`);

        // ── 13. Broken parts ────────────────────────────────────────────
        // RR3 (IN_PROGRESS): 2 broken parts — 1 ordered, 1 replaced
        em.create(BrokenPart, {
            repairRequest: rr3,
            devicePart: partList[9], // верхний разбрызгиватель DFI746
            name: 'Верхний разбрызгиватель',
            status: BrokenPartStatus.ORDERED,
            orderedAt: new Date(now.getTime() - 3 * 86_400_000),
            note: 'Трещина на оси крепления',
            createdAt: now,
            updatedAt: now,
        });
        em.create(BrokenPart, {
            repairRequest: rr3,
            name: 'Уплотнитель дверцы',
            status: BrokenPartStatus.REPLACED,
            note: 'Износ резинки, потеря эластичности',
            createdAt: now,
            updatedAt: now,
        });

        // RR3: user suggestion (isSuggestion=true)
        em.create(BrokenPart, {
            repairRequest: rr3,
            name: 'Шланг подачи воды',
            status: BrokenPartStatus.ADDED,
            isSuggestion: true,
            note: 'Пользователь думает что шланг тоже протекает',
            createdAt: now,
            updatedAt: now,
        });

        // RR4 (COMPLETED): 2 broken parts — both replaced
        em.create(BrokenPart, {
            repairRequest: rr4,
            devicePart: partList[4], // ТЭН верхний OP8687
            name: 'ТЭН верхний',
            status: BrokenPartStatus.REPLACED,
            note: 'Перегорел нагревательный элемент',
            createdAt: new Date(now.getTime() - 10 * 86_400_000),
            updatedAt: new Date(now.getTime() - 8 * 86_400_000),
        });
        em.create(BrokenPart, {
            repairRequest: rr4,
            devicePart: partList[5], // термодатчик OP8687
            name: 'Термодатчик',
            status: BrokenPartStatus.REPLACED,
            note: 'Давал некорректные показания',
            createdAt: new Date(now.getTime() - 10 * 86_400_000),
            updatedAt: new Date(now.getTime() - 8 * 86_400_000),
        });

        await em.flush();
        console.log(`${TAG} broken parts: 5 created (RR3: 3 incl. 1 suggestion, RR4: 2)`);

        // ── 14. Review ──────────────────────────────────────────────────
        em.create(Review, {
            repairRequest: rr4,
            userId: DEV_USER_IDS.user1,
            repairer: repairer1,
            rating: 5,
            comment: 'Отличный мастер! Быстро нашёл проблему, всё починил. Духовка работает как новая.',
            createdAt: new Date(now.getTime() - 6 * 86_400_000),
        });

        await em.flush();
        console.log(`${TAG} reviews: 1 created (RR4, user1→repairer1, 5★)`);

        // ── 15. Points transactions ─────────────────────────────────────
        em.create(PointsTransaction, {
            dealer: dealer1,
            type: PointsTransactionType.EARNED,
            amount: 500,
            reason: 'Продажа сертификата CERT-DEV-0001',
            createdAt: new Date(now.getTime() - 30 * 86_400_000),
        });
        em.create(PointsTransaction, {
            dealer: dealer1,
            type: PointsTransactionType.EARNED,
            amount: 1200,
            reason: 'Бонус за привлечение нового клиента',
            createdAt: new Date(now.getTime() - 20 * 86_400_000),
        });
        em.create(PointsTransaction, {
            dealer: dealer1,
            type: PointsTransactionType.SPENT,
            amount: -200,
            reason: 'Промо-материалы',
            createdAt: new Date(now.getTime() - 10 * 86_400_000),
        });
        em.create(PointsTransaction, {
            dealer: dealer2,
            type: PointsTransactionType.EARNED,
            amount: 300,
            reason: 'Продажа сертификата CERT-DEV-0003',
            createdAt: new Date(now.getTime() - 15 * 86_400_000),
        });

        await em.flush();
        console.log(`${TAG} points transactions: 4 created (dealer1: +500, +1200, -200 / dealer2: +300)`);

        // ── 16. Schedule patterns ───────────────────────────────────────
        const anchorDate = new Date('2026-04-13'); // Monday
        em.create(WSchedulePattern, {
            userId: DEV_USER_IDS.repairer1,
            cycleLength: 7,
            anchorDate,
            defaultStartTime: '09:00',
            defaultEndTime: '18:00',
            slots: [
                { work: true,  startTime: '09:00', endTime: '18:00' }, // Mon
                { work: true,  startTime: '09:00', endTime: '18:00' }, // Tue
                { work: true,  startTime: '09:00', endTime: '18:00' }, // Wed
                { work: true,  startTime: '09:00', endTime: '18:00' }, // Thu
                { work: true,  startTime: '09:00', endTime: '17:00' }, // Fri
                { work: false },                                       // Sat
                { work: false },                                       // Sun
            ],
            status: ScheduleStatus.APPROVED,
            approvedBy: DEV_USER_IDS.admin,
            approvedAt: new Date(now.getTime() - 30 * 86_400_000),
            createdAt: now,
            updatedAt: now,
        });
        em.create(WSchedulePattern, {
            userId: DEV_USER_IDS.repairer2,
            cycleLength: 14,
            anchorDate,
            defaultStartTime: '10:00',
            defaultEndTime: '19:00',
            slots: [
                { work: true,  startTime: '10:00', endTime: '19:00' }, // Mon w1
                { work: true,  startTime: '10:00', endTime: '19:00' }, // Tue
                { work: true,  startTime: '10:00', endTime: '19:00' }, // Wed
                { work: true,  startTime: '10:00', endTime: '19:00' }, // Thu
                { work: true,  startTime: '10:00', endTime: '18:00' }, // Fri
                { work: true,  startTime: '10:00', endTime: '15:00' }, // Sat
                { work: false },                                       // Sun
                { work: true,  startTime: '10:00', endTime: '19:00' }, // Mon w2
                { work: true,  startTime: '10:00', endTime: '19:00' }, // Tue
                { work: true,  startTime: '10:00', endTime: '19:00' }, // Wed
                { work: true,  startTime: '10:00', endTime: '19:00' }, // Thu
                { work: true,  startTime: '10:00', endTime: '18:00' }, // Fri
                { work: false },                                       // Sat
                { work: false },                                       // Sun
            ],
            status: ScheduleStatus.APPROVED,
            approvedBy: DEV_USER_IDS.admin,
            approvedAt: new Date(now.getTime() - 25 * 86_400_000),
            createdAt: now,
            updatedAt: now,
        });

        await em.flush();
        console.log(`${TAG} schedule patterns: 2 created`);
        console.log(`${TAG}   repairer1  7-day cycle  (Mon-Fri 09-18)     approved`);
        console.log(`${TAG}   repairer2  14-day cycle (Mon-Sat/Mon-Fri)   approved`);

        // ── 17. Vacation ────────────────────────────────────────────────
        em.create(Vacation, {
            userId: DEV_USER_IDS.repairer2,
            dateFrom: new Date('2026-05-01'),
            durationDays: 7,
            dateTo: new Date('2026-05-07'),
            status: ScheduleStatus.APPROVED,
            createdBy: DEV_USER_IDS.repairer2,
            approvedBy: DEV_USER_IDS.admin,
            note: 'Майские праздники',
            createdAt: now,
            updatedAt: now,
        });
        em.create(Vacation, {
            userId: DEV_USER_IDS.repairer1,
            dateFrom: new Date('2026-06-15'),
            durationDays: 14,
            dateTo: new Date('2026-06-28'),
            status: ScheduleStatus.PENDING,
            createdBy: DEV_USER_IDS.repairer1,
            note: 'Летний отпуск',
            createdAt: now,
            updatedAt: now,
        });

        await em.flush();
        console.log(`${TAG} vacations: 2 created`);
        console.log(`${TAG}   repairer2  01.05—07.05.2026  approved (майские)`);
        console.log(`${TAG}   repairer1  15.06—28.06.2026  pending  (летний отпуск)`);

        // ── Summary ─────────────────────────────────────────────────────
        console.log(`${TAG} ───────────────────────────────────────`);
        console.log(`${TAG} done: ${CATEGORIES.length} categories, ${DEVICES.length} devices, ${DEVICE_PARTS.length} parts,`);
        console.log(`${TAG}       2 dealers, 3 dealer clients, 2 repairers,`);
        console.log(`${TAG}       4 addresses, 6 user devices, 3 certificates,`);
        console.log(`${TAG}       6 repair requests, 9 work steps, 5 broken parts,`);
        console.log(`${TAG}       1 review, 4 points txns, 2 schedules, 2 vacations`);
    }
}
