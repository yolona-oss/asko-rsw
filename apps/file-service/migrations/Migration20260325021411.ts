import { Migration } from '@mikro-orm/migrations';

export class Migration20260325021411 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "video" ("id" uuid not null, "video" jsonb not null, "order" int not null default 0, "owner_type" text check ("owner_type" in ('repair_request', 'review', 'device', 'article')) null, "owner_id" varchar(255) null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "video_pkey" primary key ("id"));`);

    this.addSql(`alter table "image" drop constraint if exists "image_owner_type_check";`);

    this.addSql(`alter table "image" add constraint "image_owner_type_check" check("owner_type" in ('user', 'product', 'category', 'device', 'article', 'repair_request', 'certificate', 'review', 'device_part', 'broken_part'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "video" cascade;`);

    this.addSql(`alter table "image" drop constraint if exists "image_owner_type_check";`);

    this.addSql(`alter table "image" add constraint "image_owner_type_check" check("owner_type" in ('user', 'product', 'category', 'device', 'article', 'repair_request', 'certificate', 'review'));`);
  }

}
