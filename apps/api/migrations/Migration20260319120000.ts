import { Migration } from '@mikro-orm/migrations';

export class Migration20260319120000 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`alter table "repair_payment" add column "user_id" varchar(255) null`);
        this.addSql(`alter table "repair_payment" add constraint "repair_payment_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete set null`);
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "repair_payment" drop constraint "repair_payment_user_id_foreign"`);
        this.addSql(`alter table "repair_payment" drop column "user_id"`);
    }
}
