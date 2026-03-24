import { Migration } from '@mikro-orm/migrations';

export class Migration20260324123852 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "notification" ("id" varchar(255) not null, "user_id" varchar(255) not null, "type" varchar(100) not null, "title" varchar(500) not null, "body" text not null, "target_type" varchar(50) null, "target_id" varchar(255) null, "metadata" jsonb null, "is_read" boolean not null default false, "read_at" timestamptz null, "created_at" timestamptz not null, constraint "notification_pkey" primary key ("id"));`);
    this.addSql(`create index "notification_user_id_index" on "notification" ("user_id");`);
    this.addSql(`create index "notification_is_read_index" on "notification" ("is_read");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "notification" cascade;`);
  }

}
