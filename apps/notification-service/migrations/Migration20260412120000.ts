import { Migration } from '@mikro-orm/migrations';

export class Migration20260412120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "reminder_job" ("id" varchar(255) not null, "kind" varchar(50) not null, "target_type" varchar(50) not null, "target_id" varchar(255) not null, "recipient_user_ids" jsonb not null, "notification_type" varchar(100) not null, "title" varchar(500) not null, "body" text not null, "metadata" jsonb null, "interval_ms" int not null, "next_fire_at" timestamptz not null, "max_fires" int not null, "fire_count" int not null default 0, "status" varchar(20) not null default 'active', "cancel_reason" varchar(255) null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "reminder_job_pkey" primary key ("id"));`);
    this.addSql(`create index "idx_reminder_job_sweep" on "reminder_job" ("status", "next_fire_at");`);
    this.addSql(`create index "idx_reminder_job_target" on "reminder_job" ("target_type", "target_id", "status");`);
    this.addSql(`create index "idx_reminder_job_kind_target" on "reminder_job" ("kind", "target_type", "target_id", "status");`);

    this.addSql(`create index "idx_notification_target_unread" on "notification" ("target_type", "target_id", "is_read");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "idx_notification_target_unread";`);
    this.addSql(`drop table if exists "reminder_job" cascade;`);
  }

}
