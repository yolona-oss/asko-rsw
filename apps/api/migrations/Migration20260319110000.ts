import { Migration } from '@mikro-orm/migrations';

export class Migration20260319110000 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`alter table "repair_payment" add column "target_type" varchar(50) null`);
        this.addSql(`alter table "repair_payment" add column "target_id" varchar(255) null`);
        this.addSql(`alter table "repair_payment" alter column "repair_request_id" drop not null`);

        // Backfill existing rows
        this.addSql(`update "repair_payment" set "target_type" = 'repairRequest', "target_id" = "repair_request_id"::text where "repair_request_id" is not null`);
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "repair_payment" drop column "target_type"`);
        this.addSql(`alter table "repair_payment" drop column "target_id"`);
        this.addSql(`alter table "repair_payment" alter column "repair_request_id" set not null`);
    }
}
