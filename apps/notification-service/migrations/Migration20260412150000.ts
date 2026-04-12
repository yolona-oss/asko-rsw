import { Migration } from '@mikro-orm/migrations';

export class Migration20260412150000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "audience_membership" ("user_id" varchar(255) not null, "audience_key" varchar(100) not null, "source" varchar(100) null, "metadata" jsonb null, "added_at" timestamptz not null, constraint "audience_membership_pkey" primary key ("user_id", "audience_key"));`);
    this.addSql(`create index "idx_audience_membership_key" on "audience_membership" ("audience_key");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "audience_membership" cascade;`);
  }

}
