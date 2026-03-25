import { Migration } from '@mikro-orm/migrations';

export class Migration20260325120000 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`alter table "user" add column "is_active" boolean not null default true;`);
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "user" drop column "is_active";`);
    }
}
