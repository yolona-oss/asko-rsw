import { Migration } from '@mikro-orm/migrations';

export class Migration20260331100000 extends Migration {

  override async up(): Promise<void> {
    // 1. Create device_category table
    this.addSql(`create table "device_category" ("id" varchar(255) not null, "name" varchar(255) not null, "label" varchar(255) not null, "label_plural" varchar(255) not null, "order" int not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), constraint "device_category_pkey" primary key ("id"));`);
    this.addSql(`create unique index "device_category_name_unique" on "device_category" ("name");`);

    // 2. Seed the 9 existing types
    this.addSql(`insert into "device_category" ("id", "name", "label", "label_plural", "order") values
      (gen_random_uuid(), 'washing_machine', 'Стиральная машина', 'Стиральные машины', 1),
      (gen_random_uuid(), 'dryer', 'Сушильная машина', 'Сушильные машины', 2),
      (gen_random_uuid(), 'dishwasher', 'Посудомоечная машина', 'Посудомоечные машины', 3),
      (gen_random_uuid(), 'oven', 'Духовой шкаф', 'Духовые шкафы', 4),
      (gen_random_uuid(), 'cooktop', 'Варочная панель', 'Варочные панели', 5),
      (gen_random_uuid(), 'refrigerator', 'Холодильник', 'Холодильники', 6),
      (gen_random_uuid(), 'freezer', 'Морозильник', 'Морозильники', 7),
      (gen_random_uuid(), 'hood', 'Вытяжка', 'Вытяжки', 8),
      (gen_random_uuid(), 'other', 'Другое', 'Другое', 9);`);

    // 3. Add category_id to device, populate from old type column
    this.addSql(`alter table "device" add column "category_id" varchar(255);`);
    this.addSql(`update "device" set "category_id" = dc."id" from "device_category" dc where "device"."type"::text = dc."name";`);
    this.addSql(`update "device" set "category_id" = (select "id" from "device_category" where "name" = 'other') where "category_id" is null;`);
    this.addSql(`alter table "device" alter column "category_id" set not null;`);
    this.addSql(`alter table "device" add constraint "device_category_id_foreign" foreign key ("category_id") references "device_category" ("id") on update cascade;`);

    // 4. Drop old type column and enum
    this.addSql(`alter table "device" drop column "type";`);
    this.addSql(`drop type if exists "device_type";`);
  }

  override async down(): Promise<void> {
    // Recreate enum and type column
    this.addSql(`create type "device_type" as enum ('washing_machine', 'dryer', 'dishwasher', 'oven', 'cooktop', 'refrigerator', 'freezer', 'hood', 'other');`);
    this.addSql(`alter table "device" add column "type" "device_type" not null default 'other';`);
    this.addSql(`update "device" set "type" = dc."name"::"device_type" from "device_category" dc where "device"."category_id" = dc."id";`);

    // Drop FK and column
    this.addSql(`alter table "device" drop constraint "device_category_id_foreign";`);
    this.addSql(`alter table "device" drop column "category_id";`);

    // Drop category table
    this.addSql(`drop table if exists "device_category" cascade;`);
  }

}
