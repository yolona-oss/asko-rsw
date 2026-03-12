import { Migration } from '@mikro-orm/migrations';

export class Migration20260312175713 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "cursor" ("id" serial primary key, "session_id" varchar(255) not null, "user_id" varchar(255) not null, "username" varchar(255) not null, "x" int not null default 0, "y" int not null default 0, "color" varchar(255) not null, "last_update" timestamptz not null, "cursor_type" varchar(255) null);`);
    this.addSql(`alter table "cursor" add constraint "cursor_session_id_unique" unique ("session_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "cursor" cascade;`);
  }

}
