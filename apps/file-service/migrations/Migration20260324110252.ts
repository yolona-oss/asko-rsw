import { Migration } from '@mikro-orm/migrations';

export class Migration20260324110252 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "image" ("id" uuid not null, "image" jsonb not null, "alt" varchar(255) null, "order" int not null default 0, "owner_type" text check ("owner_type" in ('user', 'product', 'category', 'device', 'article', 'repair_request', 'certificate', 'review')) null, "owner_id" varchar(255) null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "image_pkey" primary key ("id"));`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "image" cascade;`);
  }

}
