import { Migration } from '@mikro-orm/migrations';

export class Migration20260411035122 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "document" ("id" uuid not null, "owner_type" varchar(32) not null, "owner_id" varchar(255) not null, "storage_url" varchar(1024) not null, "public_id" varchar(255) null, "mime_type" varchar(128) not null, "filename" varchar(255) not null, "size_bytes" bigint not null default 0, "created_at" timestamptz not null, constraint "document_pkey" primary key ("id"));`);
    this.addSql(`create index "document_owner_type_index" on "document" ("owner_type");`);
    this.addSql(`create index "document_owner_id_index" on "document" ("owner_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "document" cascade;`);
  }

}
