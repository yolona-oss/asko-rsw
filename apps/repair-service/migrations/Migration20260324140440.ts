import { Migration } from '@mikro-orm/migrations';

export class Migration20260324140440 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create type "broken_part_status" as enum ('added', 'ordered', 'shipped', 'replaced');`);
    this.addSql(`create table "device_part" ("id" varchar(255) not null, "device_id" varchar(255) not null, "name" varchar(255) not null, "part_number" varchar(255) null, "price" real null, "description" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "device_part_pkey" primary key ("id"));`);

    this.addSql(`create table "broken_part" ("id" varchar(255) not null, "repair_request_id" varchar(255) not null, "device_part_id" varchar(255) null, "name" varchar(255) not null, "status" "broken_part_status" not null default 'added', "note" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "broken_part_pkey" primary key ("id"));`);

    this.addSql(`alter table "device_part" add constraint "device_part_device_id_foreign" foreign key ("device_id") references "device" ("id") on update cascade;`);

    this.addSql(`alter table "broken_part" add constraint "broken_part_repair_request_id_foreign" foreign key ("repair_request_id") references "repair_request" ("id") on update cascade;`);
    this.addSql(`alter table "broken_part" add constraint "broken_part_device_part_id_foreign" foreign key ("device_part_id") references "device_part" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "broken_part" drop constraint "broken_part_device_part_id_foreign";`);

    this.addSql(`drop table if exists "device_part" cascade;`);

    this.addSql(`drop table if exists "broken_part" cascade;`);

    this.addSql(`drop type "broken_part_status";`);
  }

}
