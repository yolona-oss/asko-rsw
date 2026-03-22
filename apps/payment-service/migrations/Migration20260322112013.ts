import { Migration } from '@mikro-orm/migrations';

export class Migration20260322112013 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create type "payment_status" as enum ('pending', 'paid', 'refunded', 'failed');`);
    this.addSql(`create table "payment" ("id" varchar(255) not null, "user_id" varchar(255) null, "target_type" varchar(50) null, "target_id" varchar(255) null, "amount" real not null, "currency" varchar(10) not null default 'rub', "status" "payment_status" not null default 'pending', "provider" varchar(255) null, "provider_payment_id" varchar(255) null, "metadata" jsonb null, "paid_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "payment_pkey" primary key ("id"));`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "payment" cascade;`);

    this.addSql(`drop type "payment_status";`);
  }

}
