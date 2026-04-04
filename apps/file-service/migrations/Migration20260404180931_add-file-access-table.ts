import { Migration } from '@mikro-orm/migrations';

export class Migration20260404180931AddFileAccessTable extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "file_access" ("id" uuid not null, "file_id" varchar(255) not null, "file_type" varchar(10) not null, "visibility" varchar(255) not null default 'public', "creator_id" varchar(255) null, "conversation_id" varchar(255) null, "created_at" timestamptz not null default now(), constraint "file_access_pkey" primary key ("id"))`);
    this.addSql(`create index if not exists "file_access_file_id_index" on "file_access" ("file_id")`);

    // Remove old columns from image and video tables if they exist
    this.addSql(`alter table "image" drop column if exists "visibility"`);
    this.addSql(`alter table "image" drop column if exists "creator_id"`);
    this.addSql(`alter table "image" drop column if exists "conversation_id"`);
    this.addSql(`alter table "video" drop column if exists "visibility"`);
    this.addSql(`alter table "video" drop column if exists "creator_id"`);
    this.addSql(`alter table "video" drop column if exists "conversation_id"`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "file_access"`);
  }

}
