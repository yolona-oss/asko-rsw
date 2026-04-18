import { Migration } from '@mikro-orm/migrations';

export class Migration20260418201358 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "overtime" ("id" uuid not null, "user_id" varchar(255) not null, "date" date not null, "start_time" varchar(5) not null, "end_time" varchar(5) not null, "status" text check ("status" in ('pending', 'approved', 'rejected')) not null default 'pending', "created_by" varchar(255) null, "approved_by" varchar(255) null, "note" text null, "auto_generated" boolean not null default false, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "overtime_pkey" primary key ("id"));`);

    this.addSql(`create table if not exists "schedule_override" ("id" uuid not null, "user_id" varchar(255) not null, "date" date not null, "start_time" varchar(5) not null, "end_time" varchar(5) not null, "status" text check ("status" in ('pending', 'approved', 'rejected')) not null default 'pending', "created_by" varchar(255) null, "approved_by" varchar(255) null, "note" text null, "auto_generated" boolean not null default false, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "schedule_override_pkey" primary key ("id"));`);

    this.addSql(`create table if not exists "sick_leave" ("id" uuid not null, "user_id" varchar(255) not null, "date_from" date not null, "duration_days" int not null, "date_to" date not null, "status" text check ("status" in ('pending', 'approved', 'rejected')) not null default 'pending', "created_by" varchar(255) null, "approved_by" varchar(255) null, "note" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "sick_leave_pkey" primary key ("id"));`);

    this.addSql(`create table if not exists "vacation" ("id" uuid not null, "user_id" varchar(255) not null, "date_from" date not null, "duration_days" int not null, "date_to" date not null, "status" text check ("status" in ('pending', 'approved', 'rejected')) not null default 'pending', "created_by" varchar(255) null, "approved_by" varchar(255) null, "note" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "vacation_pkey" primary key ("id"));`);

    this.addSql(`drop table if exists "paid_payment" cascade;`);

    this.addSql(`drop table if exists "wschedule" cascade;`);

    this.addSql(`do $$ begin
      alter table "repair_request" add column "is_cross_city" boolean not null default false;
    exception when duplicate_column then null;
    end $$;`);
    this.addSql(`do $$ begin
      alter table "repair_request" add column "timezone_offset_hours" smallint null;
    exception when duplicate_column then null;
    end $$;`);
  }

  override async down(): Promise<void> {
    this.addSql(`create table "paid_payment" ("payment_id" varchar(255) not null, "target_type" varchar(50) not null, "target_id" varchar(255) not null, "user_id" varchar(255) null, "amount" float8 null, "currency" varchar(10) null, "paid_at" timestamptz(6) not null default now(), constraint "paid_payment_pkey" primary key ("payment_id"));`);
    this.addSql(`alter table "paid_payment" add constraint "paid_payment_target_type_id_unique" unique ("target_type", "target_id");`);
    this.addSql(`create index "paid_payment_target_type_index" on "paid_payment" ("target_type");`);

    this.addSql(`create table "wschedule" ("id" uuid not null, "user_id" varchar(255) not null, "type" text check ("type" in ('vacation', 'sick_leave', 'overtime', 'extra_day')) not null, "start_time" varchar(5) not null, "end_time" varchar(5) not null, "status" text check ("status" in ('pending', 'approved', 'rejected')) not null default 'pending', "approved_by" varchar(255) null, "note" text null, "auto_generated" bool not null default false, "created_at" timestamptz(6) not null, "updated_at" timestamptz(6) not null, "date_from" date not null, "date_to" date not null, "created_by" varchar(255) null, constraint "wschedule_pkey" primary key ("id"));`);

    this.addSql(`drop table if exists "overtime" cascade;`);

    this.addSql(`drop table if exists "schedule_override" cascade;`);

    this.addSql(`drop table if exists "sick_leave" cascade;`);

    this.addSql(`drop table if exists "vacation" cascade;`);

    this.addSql(`alter table "repair_request" drop column "is_cross_city", drop column "timezone_offset_hours";`);
  }

}
