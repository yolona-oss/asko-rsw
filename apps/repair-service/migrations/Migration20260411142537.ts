import { Migration } from '@mikro-orm/migrations';

export class Migration20260411142537 extends Migration {

  override async up(): Promise<void> {
    // Drop old single-day WORK entries (WORK days are now represented by wschedule_pattern).
    this.addSql(`delete from "wschedule" where "type" = 'work';`);

    // Replace single-date columns with a required range.
    this.addSql(`alter table "wschedule" add column "date_from" date null;`);
    this.addSql(`alter table "wschedule" add column "date_to" date null;`);
    this.addSql(`update "wschedule" set "date_from" = "date", "date_to" = "date" where "date" is not null;`);
    // For any remaining rows without a date (shouldn't exist after the delete above), fill with now.
    this.addSql(`update "wschedule" set "date_from" = current_date where "date_from" is null;`);
    this.addSql(`update "wschedule" set "date_to" = current_date where "date_to" is null;`);
    this.addSql(`alter table "wschedule" alter column "date_from" set not null;`);
    this.addSql(`alter table "wschedule" alter column "date_to" set not null;`);
    this.addSql(`alter table "wschedule" drop column "day_of_week";`);
    this.addSql(`alter table "wschedule" drop column "date";`);

    // Tighten the type enum (drop 'work').
    this.addSql(`alter table "wschedule" drop constraint if exists "wschedule_type_check";`);
    this.addSql(`alter table "wschedule" add constraint "wschedule_type_check" check ("type" in ('vacation', 'sick_leave', 'overtime', 'extra_day'));`);

    // New pattern table — one row per user.
    this.addSql(`create table "wschedule_pattern" (
      "id" uuid not null,
      "user_id" varchar(255) not null,
      "cycle_length" int not null,
      "anchor_date" date not null,
      "default_start_time" varchar(5) not null,
      "default_end_time" varchar(5) not null,
      "slots" jsonb not null,
      "created_at" timestamptz not null,
      "updated_at" timestamptz not null,
      constraint "wschedule_pattern_pkey" primary key ("id")
    );`);
    this.addSql(`alter table "wschedule_pattern" add constraint "wschedule_pattern_user_id_unique" unique ("user_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "wschedule_pattern";`);

    this.addSql(`alter table "wschedule" add column "day_of_week" int null;`);
    this.addSql(`alter table "wschedule" add column "date" date null;`);
    this.addSql(`update "wschedule" set "date" = "date_from";`);
    this.addSql(`alter table "wschedule" drop column "date_from";`);
    this.addSql(`alter table "wschedule" drop column "date_to";`);

    this.addSql(`alter table "wschedule" drop constraint if exists "wschedule_type_check";`);
    this.addSql(`alter table "wschedule" add constraint "wschedule_type_check" check ("type" in ('work', 'vacation', 'sick_leave', 'overtime', 'extra_day'));`);
  }

}
