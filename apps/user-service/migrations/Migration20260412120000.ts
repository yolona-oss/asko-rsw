import { Migration } from '@mikro-orm/migrations';

export class Migration20260412120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "user_status_history" (
      "id" uuid not null,
      "user_id" varchar(255) not null,
      "is_active" boolean not null,
      "changed_by" varchar(255) null,
      "changed_at" timestamptz not null,
      constraint "user_status_history_pkey" primary key ("id")
    );`);

    this.addSql(`create index "idx_user_status_user_changed" on "user_status_history" ("user_id", "changed_at");`);

    // Backfill: seed one row per existing user with their current isActive value.
    this.addSql(`insert into "user_status_history" ("id", "user_id", "is_active", "changed_by", "changed_at")
      select gen_random_uuid(), "id", "is_active", null, "created_at"
      from "user" ;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "user_status_history";`);
  }

}
