import { Migration } from '@mikro-orm/migrations';

export class Migration20260404152651 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "dealer_profile" drop constraint chk_points_balance_non_negative;`);

    this.addSql(`alter table "device_category" alter column "created_at" drop default;`);
    this.addSql(`alter table "device_category" alter column "created_at" type timestamptz using ("created_at"::timestamptz);`);
    this.addSql(`alter table "device_category" alter column "updated_at" drop default;`);
    this.addSql(`alter table "device_category" alter column "updated_at" type timestamptz using ("updated_at"::timestamptz);`);

    this.addSql(`alter table "wschedule" add column "user_id" varchar(255) not null, add column "type" text check ("type" in ('work', 'vacation', 'sick_leave', 'overtime', 'extra_day')) not null, add column "day_of_week" int null, add column "date" date null, add column "status" text check ("status" in ('pending', 'approved', 'rejected')) not null default 'pending', add column "note" text null, add column "auto_generated" boolean not null default false, add column "created_at" timestamptz not null, add column "updated_at" timestamptz not null;`);
    this.addSql(`alter table "wschedule" alter column "start_time" type varchar(5) using ("start_time"::varchar(5));`);
    this.addSql(`alter table "wschedule" alter column "end_time" type varchar(5) using ("end_time"::varchar(5));`);
    this.addSql(`alter table "wschedule" rename column "repeat_rule" to "approved_by";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "dealer_profile" add constraint chk_points_balance_non_negative check(points_balance >= 0);`);

    this.addSql(`alter table "device_category" alter column "created_at" type timestamptz(6) using ("created_at"::timestamptz(6));`);
    this.addSql(`alter table "device_category" alter column "created_at" set default now();`);
    this.addSql(`alter table "device_category" alter column "updated_at" type timestamptz(6) using ("updated_at"::timestamptz(6));`);
    this.addSql(`alter table "device_category" alter column "updated_at" set default now();`);

    this.addSql(`alter table "wschedule" drop column "user_id", drop column "type", drop column "day_of_week", drop column "date", drop column "status", drop column "note", drop column "auto_generated", drop column "created_at", drop column "updated_at";`);

    this.addSql(`alter table "wschedule" alter column "start_time" type timestamptz(6) using ("start_time"::timestamptz(6));`);
    this.addSql(`alter table "wschedule" alter column "end_time" type timestamptz(6) using ("end_time"::timestamptz(6));`);
    this.addSql(`alter table "wschedule" rename column "approved_by" to "repeat_rule";`);
  }

}
