import { Migration } from '@mikro-orm/migrations';

export class Migration20260404175303 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "file_access" ("id" uuid not null, "file_id" varchar(255) not null, "file_type" varchar(10) not null, "visibility" text check ("visibility" in ('public', 'private', 'role_restricted', 'participants_only')) not null default 'public', "creator_id" varchar(255) null, "conversation_id" varchar(255) null, "created_at" timestamptz not null, constraint "file_access_pkey" primary key ("id"));`);
    this.addSql(`create index "file_access_file_id_index" on "file_access" ("file_id");`);

    this.addSql(`alter table "image" drop constraint if exists "image_owner_type_check";`);

    this.addSql(`alter table "image" add constraint "image_owner_type_check" check("owner_type" in ('user', 'category', 'device', 'article', 'repair_request', 'certificate', 'review', 'device_part', 'broken_part'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "file_access" cascade;`);

    this.addSql(`alter table "image" drop constraint if exists "image_owner_type_check";`);

    this.addSql(`alter table "image" add constraint "image_owner_type_check" check("owner_type" in ('user', 'product', 'category', 'device', 'article', 'repair_request', 'certificate', 'review', 'device_part', 'broken_part'));`);
  }

}
