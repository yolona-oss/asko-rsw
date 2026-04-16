import { Migration } from '@mikro-orm/migrations';

export class Migration20260416130000 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`
            create table "paid_payment" (
                "payment_id" varchar(255) not null,
                "target_type" varchar(50) not null,
                "target_id" varchar(255) not null,
                "user_id" varchar(255) null,
                "amount" double precision null,
                "currency" varchar(10) null,
                "paid_at" timestamptz not null default now(),
                constraint "paid_payment_pkey" primary key ("payment_id")
            );
        `);
        this.addSql(`create index "paid_payment_target_type_index" on "paid_payment" ("target_type");`);
        this.addSql(`create unique index "paid_payment_target_type_id_unique" on "paid_payment" ("target_type", "target_id");`);
    }

    override async down(): Promise<void> {
        this.addSql(`drop table if exists "paid_payment";`);
    }
}
