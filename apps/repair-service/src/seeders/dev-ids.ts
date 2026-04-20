/**
 * Deterministic UUIDs for dev seed data.
 * Must match apps/user-service/src/seeders/dev-ids.ts — userId is stored
 * here as a plain string (not a cross-service FK), so the values have to
 * be identical on both sides for seeded data to line up.
 */
export const DEV_USER_IDS = {
    superAdmin: '00000000-0000-4000-8000-000000000001',
    admin:      '00000000-0000-4000-8000-000000000002',
    dealer1:    '00000000-0000-4000-8000-000000000003',
    dealer2:    '00000000-0000-4000-8000-000000000004',
    manager1:   '00000000-0000-4000-8000-000000000005',
    manager2:   '00000000-0000-4000-8000-000000000006',
    repairer1:  '00000000-0000-4000-8000-000000000007',
    repairer2:  '00000000-0000-4000-8000-000000000008',
    user1:      '00000000-0000-4000-8000-000000000009',
    user2:      '00000000-0000-4000-8000-00000000000a',
    user3:      '00000000-0000-4000-8000-00000000000b',
    user4:      '00000000-0000-4000-8000-00000000000c',
} as const;
