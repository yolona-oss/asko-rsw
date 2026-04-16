import { Migration } from '@mikro-orm/migrations';

export class Migration20260416140000 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`alter table "w_schedule" add column "created_by" varchar(255) null;`);
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "w_schedule" drop column "created_by";`);
    }
}
