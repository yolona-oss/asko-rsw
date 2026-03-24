import { Migration } from '@mikro-orm/migrations';

export class Migration20260324154329 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "article" ("id" varchar(255) not null, "title" varchar(255) not null, "slug" varchar(255) not null, "text" text not null, "tags" jsonb null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "article_pkey" primary key ("id"));`);
    this.addSql(`alter table "article" add constraint "article_slug_unique" unique ("slug");`);

    this.addSql(`create table "cursor" ("id" serial primary key, "session_id" varchar(255) not null, "user_id" varchar(255) not null, "username" varchar(255) not null, "x" int not null default 0, "y" int not null default 0, "color" varchar(255) not null, "last_update" timestamptz not null, "cursor_type" varchar(255) null);`);
    this.addSql(`alter table "cursor" add constraint "cursor_session_id_unique" unique ("session_id");`);

    this.addSql(`create table "wschedule" ("id" uuid not null, "start_time" timestamptz not null, "end_time" timestamptz not null, "repeat_rule" varchar(255) null, constraint "wschedule_pkey" primary key ("id"));`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "article" cascade;`);

    this.addSql(`drop table if exists "cursor" cascade;`);

    this.addSql(`drop table if exists "wschedule" cascade;`);
  }

}
