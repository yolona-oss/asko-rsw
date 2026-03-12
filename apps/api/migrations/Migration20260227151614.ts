import { Migration } from '@mikro-orm/migrations';

export class Migration20260227151614 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create type "role" as enum ('super_admin', 'owner', 'delivery_person', 'employee', 'customer');`);
    this.addSql(`create table "address" ("id" uuid not null, "country" varchar(255) not null, "city" varchar(255) not null, "street" varchar(255) not null, "house" int not null, "building" int null, "floor" int null, "room" int null, "postal_code" varchar(255) null, constraint "address_pkey" primary key ("id"));`);

    this.addSql(`create table "cities" ("id" uuid not null, "name" varchar(255) not null, "region" varchar(255) not null, "country" varchar(100) not null, "base_zone" varchar(100) null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "cities_pkey" primary key ("id"));`);
    this.addSql(`create index "cities_name_index" on "cities" ("name");`);
    this.addSql(`alter table "cities" add constraint "cities_name_unique" unique ("name");`);

    this.addSql(`create table "city_distances" ("id" uuid not null, "from_city_id" uuid not null, "to_city_id" uuid not null, "distance_km" int not null, "created_at" timestamptz not null, constraint "city_distances_pkey" primary key ("id"), constraint city_distances_check check (from_city_id <> to_city_id));`);
    this.addSql(`create index "city_distances_from_city_id_index" on "city_distances" ("from_city_id");`);
    this.addSql(`create index "city_distances_to_city_id_index" on "city_distances" ("to_city_id");`);
    this.addSql(`alter table "city_distances" add constraint "city_distances_from_city_id_to_city_id_unique" unique ("from_city_id", "to_city_id");`);

    this.addSql(`create table "fuel_surcharges" ("id" uuid not null, "name" varchar(255) not null, "coefficient" numeric(5,2) not null, "is_active" boolean not null default true, constraint "fuel_surcharges_pkey" primary key ("id"));`);
    this.addSql(`create index "fuel_surcharges_is_active_index" on "fuel_surcharges" ("is_active");`);

    this.addSql(`create table "image" ("id" uuid not null, "image" jsonb not null, "alt" varchar(255) null, "order" int not null default 0, "owner_type" text check ("owner_type" in ('user', 'product', 'category')) null, "owner_id" varchar(255) null, "blank_type" text check ("blank_type" in ('user', 'product', 'category')) null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "image_pkey" primary key ("id"));`);

    this.addSql(`create table "pallet_coefficients" ("id" uuid not null, "min_pallets" int not null, "max_pallets" int not null, "coefficient" numeric(5,2) not null, constraint "pallet_coefficients_pkey" primary key ("id"), constraint pallet_coefficients_check check (min_pallets <= max_pallets));`);

    this.addSql(`create table "payment" ("id" varchar(255) not null, "provider" varchar(255) not null, "provider_payment_id" varchar(255) not null, "amount" int not null, "currency" varchar(255) not null, "captured" boolean not null default false, "created_at" timestamptz null, constraint "payment_pkey" primary key ("id"));`);

    this.addSql(`create table "tariffs" ("id" uuid not null, "name" varchar(255) not null, "price_per_km" numeric(10,2) not null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "tariffs_pkey" primary key ("id"));`);
    this.addSql(`create index "tariffs_is_active_index" on "tariffs" ("is_active");`);

    this.addSql(`create table "user" ("id" varchar(255) not null, "first_name" varchar(255) null, "last_name" varchar(255) null, "email" varchar(255) null, "password_hash" varchar(255) null, "phone" varchar(255) null, "roles" "role"[] not null default '{customer}', "preferences" jsonb null, "providers" text[] not null default '{EMAIL}', "google_id" varchar(255) null, "email_verified" boolean not null default false, "phone_verified" boolean not null default false, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "user_pkey" primary key ("id"));`);
    this.addSql(`alter table "user" add constraint "user_email_unique" unique ("email");`);
    this.addSql(`alter table "user" add constraint "user_phone_unique" unique ("phone");`);

    this.addSql(`create table "session" ("id" uuid not null, "user_id" varchar(255) not null, "type" text check ("type" in ('ACCESS', 'REFRESH', 'RESET_PASSWORD', 'VERIFY_EMAIL')) not null default 'REFRESH', "token" varchar(255) not null, "device_info" varchar(255) not null, "ip_address" varchar(255) not null, "expires_at" timestamptz not null, "created_at" timestamptz not null, constraint "session_pkey" primary key ("id"));`);

    this.addSql(`create table "user_address" ("id" serial primary key, "user_id" varchar(255) not null, "address_id" uuid not null, "is_primary" boolean not null default false);`);

    this.addSql(`create table "weight_coefficients" ("id" uuid not null, "min_kg" int not null, "max_kg" int not null, "coefficient" numeric(5,2) not null, constraint "weight_coefficients_pkey" primary key ("id"), constraint weight_coefficients_check check (min_kg <= max_kg));`);

    this.addSql(`create table "wschedule" ("id" uuid not null, "start_time" timestamptz not null, "end_time" timestamptz not null, "repeat_rule" varchar(255) null, constraint "wschedule_pkey" primary key ("id"));`);

    this.addSql(`create table "employee" ("id" varchar(255) not null, "user_id" varchar(255) not null, "role" text check ("role" in ('driver', 'waiter', 'manager', 'chef', 'kitchener', 'cleaner')) not null, "schedule_id" uuid null, constraint "employee_pkey" primary key ("id"));`);

    this.addSql(`alter table "city_distances" add constraint "city_distances_from_city_id_foreign" foreign key ("from_city_id") references "cities" ("id") on update cascade;`);
    this.addSql(`alter table "city_distances" add constraint "city_distances_to_city_id_foreign" foreign key ("to_city_id") references "cities" ("id") on update cascade;`);

    this.addSql(`alter table "session" add constraint "session_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`);

    this.addSql(`alter table "user_address" add constraint "user_address_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`);
    this.addSql(`alter table "user_address" add constraint "user_address_address_id_foreign" foreign key ("address_id") references "address" ("id") on update cascade;`);

    this.addSql(`alter table "employee" add constraint "employee_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`);
    this.addSql(`alter table "employee" add constraint "employee_schedule_id_foreign" foreign key ("schedule_id") references "wschedule" ("id") on update cascade on delete set null;`);
  }

}
