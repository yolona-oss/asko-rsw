import 'tsconfig-paths/register';
import { config as dotenvConfig } from 'dotenv';
import { defineConfig } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import path from 'path';
import { User, Session, InvitationLink, UserAddress } from 'entities';

dotenvConfig({ path: path.join(process.cwd(), '.env') });

const config = defineConfig<PostgreSqlDriver>({
    driver: PostgreSqlDriver,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    dbName: process.env.DATABASE_DB_NAME,
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    entities: [User, Session, InvitationLink, UserAddress],
    migrations: {
        path: path.join(process.cwd(), 'migrations'),
    },
    debug: process.env.NODE_ENV !== 'production',
});

export default config;
