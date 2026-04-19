import { Migration } from '@mikro-orm/migrations';

export class Migration20260419101059 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "notification_preferences" ("user_id" varchar(255) not null, "global_mute" boolean not null default false, "groups" jsonb not null, "updated_at" timestamptz not null, constraint "notification_preferences_pkey" primary key ("user_id"));`);

    this.addSql(`create table "push_subscription" ("id" varchar(255) not null, "user_id" varchar(255) not null, "endpoint" text not null, "p256dh" text not null, "auth" text not null, "user_agent" varchar(500) null, "created_at" timestamptz not null, constraint "push_subscription_pkey" primary key ("id"));`);
    this.addSql(`create index "idx_push_subscription_user" on "push_subscription" ("user_id");`);
    this.addSql(`alter table "push_subscription" add constraint "uq_push_subscription_endpoint" unique ("endpoint");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "notification_preferences" cascade;`);

    this.addSql(`drop table if exists "push_subscription" cascade;`);
  }

}
