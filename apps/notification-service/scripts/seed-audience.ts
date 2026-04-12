import 'tsconfig-paths/register';
import { config as dotenvConfig } from 'dotenv';
import { getEnvFilePath } from '@asko/shared';
import { MikroORM } from '@mikro-orm/core';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';

dotenvConfig({ path: getEnvFilePath(), override: true });

// Late imports so dotenv is applied before any module initialization
import ormConfig from '../src/mikro-orm.config';
import { AudienceMembershipEntity } from '../src/entities/audience-membership.entity';

interface GrpcUserResponse {
    id: string;
    roles?: string[];
}

interface GrpcPaginatedUsersResponse {
    data: GrpcUserResponse[];
    overallCount: number;
    page: number;
    limit: number;
}

interface UserGrpcClient {
    findAllUsers: (
        req: { page: number; limit: number; search: string; role: string; status: string; sortBy: string; sortOrder: string },
        cb: (err: grpc.ServiceError | null, res: GrpcPaginatedUsersResponse) => void,
    ) => void;
    close: () => void;
}

function createUserClient(addr: string): UserGrpcClient {
    const protoPath = path.join(process.cwd(), '../../packages/proto/user.proto');
    const packageDef = protoLoader.loadSync(protoPath, {
        keepCase: false,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
    });
    const proto = grpc.loadPackageDefinition(packageDef) as any;
    const UserService = proto.user.UserService;
    return new UserService(addr, grpc.credentials.createInsecure()) as UserGrpcClient;
}

function findAllUsers(
    client: UserGrpcClient,
    page: number,
    limit: number,
): Promise<GrpcPaginatedUsersResponse> {
    return new Promise((resolve, reject) => {
        client.findAllUsers(
            { page, limit, search: '', role: '', status: '', sortBy: '', sortOrder: '' },
            (err, res) => (err ? reject(err) : resolve(res)),
        );
    });
}

async function main() {
    const addr = process.env.USER_SERVICE_ADDR ?? 'localhost:5000';
    console.log(`[seed-audience] user-service @ ${addr}`);

    const orm = await MikroORM.init(ormConfig);
    const em = orm.em.fork();
    const client = createUserClient(addr);

    const limit = 200;
    let page = 1;
    let totalUsers = 0;
    let totalMemberships = 0;

    // Wipe existing role:* rows so re-runs are clean.
    const deleted = await em.nativeDelete(AudienceMembershipEntity, {
        audienceKey: { $like: 'role:%' },
    });
    console.log(`[seed-audience] cleared ${deleted} existing role:* rows`);

    while (true) {
        const res = await findAllUsers(client, page, limit);
        if (!res.data || res.data.length === 0) break;

        for (const u of res.data) {
            const roles = (u.roles ?? []).filter(Boolean);
            if (!u.id || roles.length === 0) continue;
            for (const role of roles) {
                em.persist(
                    em.create(AudienceMembershipEntity, {
                        userId: u.id,
                        audienceKey: `role:${role}`,
                        source: 'seed-audience',
                        addedAt: new Date(),
                    }),
                );
                totalMemberships += 1;
            }
            totalUsers += 1;
        }

        await em.flush();
        em.clear();

        const fetched = page * limit;
        console.log(`[seed-audience] page=${page} fetched=${res.data.length} total=${totalUsers}`);
        if (fetched >= res.overallCount) break;
        page += 1;
    }

    console.log(
        `[seed-audience] done: users=${totalUsers} memberships=${totalMemberships}`,
    );

    await orm.close();
    client.close();
}

main().catch((err) => {
    console.error('[seed-audience] failed:', err);
    process.exit(1);
});
