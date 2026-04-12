import { Migration } from '@mikro-orm/migrations';

export class Migration20260412120000 extends Migration {

  override async up(): Promise<void> {
    // ─── Pattern history table ───────────────────────────────────────────
    this.addSql(`create table "wschedule_pattern_history" (
      "id" uuid not null,
      "pattern_id" uuid not null,
      "user_id" varchar(255) not null,
      "cycle_length" int not null,
      "anchor_date" date not null,
      "default_start_time" varchar(5) not null,
      "default_end_time" varchar(5) not null,
      "slots" jsonb not null,
      "status" text not null,
      "pending_data" jsonb null,
      "change_type" text not null,
      "changed_by" varchar(255) null,
      "is_active" boolean not null,
      "effective_from" timestamptz not null,
      "changed_at" timestamptz not null,
      constraint "wschedule_pattern_history_pkey" primary key ("id")
    );`);

    this.addSql(`create index "idx_pattern_history_user_changed" on "wschedule_pattern_history" ("user_id", "changed_at");`);
    this.addSql(`create index "idx_pattern_history_user_effective" on "wschedule_pattern_history" ("user_id", "effective_from");`);

    // Backfill existing patterns as initial 'created' snapshots.
    this.addSql(`insert into "wschedule_pattern_history"
      ("id", "pattern_id", "user_id", "cycle_length", "anchor_date",
       "default_start_time", "default_end_time", "slots", "status",
       "pending_data", "change_type", "changed_by", "is_active",
       "effective_from", "changed_at")
      select
        gen_random_uuid(), "id", "user_id", "cycle_length", "anchor_date",
        "default_start_time", "default_end_time", "slots", "status",
        "pending_data", 'created', null, true,
        "created_at", now()
      from "wschedule_pattern";`);

    // ─── Local user status read-model ────────────────────────────────────
    this.addSql(`create table "user_status_history" (
      "id" uuid not null,
      "user_id" varchar(255) not null,
      "is_active" boolean not null,
      "changed_by" varchar(255) null,
      "changed_at" timestamptz not null,
      constraint "user_status_history_pkey" primary key ("id")
    );`);

    this.addSql(`create index "idx_user_status_user_changed" on "user_status_history" ("user_id", "changed_at");`);

    // Backfill: seed one row per user who has a schedule pattern, assume active.
    this.addSql(`insert into "user_status_history" ("id", "user_id", "is_active", "changed_by", "changed_at")
      select gen_random_uuid(), "user_id", true, null, "created_at"
      from "wschedule_pattern";`);

    // ─── Performance indexes on existing wschedule table ─────────────────
    this.addSql(`create index "idx_wschedule_user_status_dates" on "wschedule" ("user_id", "status", "date_from", "date_to");`);
    this.addSql(`create index "idx_wschedule_user_type_dates" on "wschedule" ("user_id", "type", "date_from", "date_to");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "idx_wschedule_user_type_dates";`);
    this.addSql(`drop index if exists "idx_wschedule_user_status_dates";`);
    this.addSql(`drop table if exists "user_status_history";`);
    this.addSql(`drop table if exists "wschedule_pattern_history";`);
  }

}
