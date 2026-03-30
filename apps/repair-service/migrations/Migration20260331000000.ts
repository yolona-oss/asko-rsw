import { Migration } from '@mikro-orm/migrations';

export class Migration20260331000000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "wschedule" ("id" uuid not null, "start_time" timestamptz not null, "end_time" timestamptz not null, "repeat_rule" varchar(255) null, constraint "wschedule_pkey" primary key ("id"));`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "wschedule" cascade;`);
  }

}
