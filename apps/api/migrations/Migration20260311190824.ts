import { Migration } from '@mikro-orm/migrations';

export class Migration20260311190824 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "city_distances" drop constraint "city_distances_from_city_id_foreign";`);

    this.addSql(`alter table "city_distances" drop constraint "city_distances_to_city_id_foreign";`);

    this.addSql(`create table "invitation_link" ("id" uuid not null, "token" varchar(255) not null, "role" text check ("role" in ('super_admin', 'admin', 'dealer', 'manager', 'user')) not null, "ttl" int not null, "used" boolean not null default false, "created_by_id" varchar(255) not null, "expires_at" timestamptz not null, "created_at" timestamptz not null, constraint "invitation_link_pkey" primary key ("id"));`);
    this.addSql(`comment on column "invitation_link"."ttl" is 'TTL in seconds';`);
    this.addSql(`alter table "invitation_link" add constraint "invitation_link_token_unique" unique ("token");`);

    this.addSql(`alter table "invitation_link" add constraint "invitation_link_created_by_id_foreign" foreign key ("created_by_id") references "user" ("id") on update cascade;`);

    this.addSql(`drop table if exists "cities" cascade;`);

    this.addSql(`drop table if exists "city_distances" cascade;`);

    this.addSql(`drop table if exists "fuel_surcharges" cascade;`);

    this.addSql(`drop table if exists "pallet_coefficients" cascade;`);

    this.addSql(`drop table if exists "tariffs" cascade;`);

    this.addSql(`drop table if exists "weight_coefficients" cascade;`);

    // Recreate the role enum with new values (rename → create → migrate → drop old)
    this.addSql(`alter table "user" alter column "roles" drop default;`);
    this.addSql(`alter table "user" alter column "roles" type text[] using "roles"::text[];`);
    this.addSql(`drop type if exists "role";`);
    this.addSql(`create type "role" as enum ('super_admin', 'admin', 'dealer', 'manager', 'user');`);
    // Migrate old 'customer' values to 'user'
    this.addSql(`update "user" set "roles" = array_replace("roles", 'customer', 'user');`);
    this.addSql(`alter table "user" alter column "roles" type "role"[] using "roles"::"role"[];`);
    this.addSql(`alter table "user" alter column "roles" set default '{user}';`);

    this.addSql(`alter table "employee" drop column "role";`);
  }

  override async down(): Promise<void> {
    this.addSql(`create table "cities" ("id" uuid not null, "name" varchar(255) not null, "region" varchar(255) not null, "country" varchar(100) not null, "base_zone" varchar(100) null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "cities_pkey" primary key ("id"));`);
    this.addSql(`create index "cities_name_index" on "cities" ("name");`);
    this.addSql(`alter table "cities" add constraint "cities_name_unique" unique ("name");`);

    this.addSql(`create table "city_distances" ("id" uuid not null, "from_city_id" uuid not null, "to_city_id" uuid not null, "distance_km" int not null, "created_at" timestamptz not null, constraint "city_distances_pkey" primary key ("id"), constraint city_distances_check check (from_city_id <> to_city_id));`);
    this.addSql(`create index "city_distances_from_city_id_index" on "city_distances" ("from_city_id");`);
    this.addSql(`create index "city_distances_to_city_id_index" on "city_distances" ("to_city_id");`);
    this.addSql(`alter table "city_distances" add constraint "city_distances_from_city_id_to_city_id_unique" unique ("from_city_id", "to_city_id");`);

    this.addSql(`create table "fuel_surcharges" ("id" uuid not null, "name" varchar(255) not null, "coefficient" numeric(5,2) not null, "is_active" boolean not null default true, constraint "fuel_surcharges_pkey" primary key ("id"));`);
    this.addSql(`create index "fuel_surcharges_is_active_index" on "fuel_surcharges" ("is_active");`);

    this.addSql(`create table "pallet_coefficients" ("id" uuid not null, "min_pallets" int not null, "max_pallets" int not null, "coefficient" numeric(5,2) not null, constraint "pallet_coefficients_pkey" primary key ("id"), constraint pallet_coefficients_check check (min_pallets <= max_pallets));`);

    this.addSql(`create table "tariffs" ("id" uuid not null, "name" varchar(255) not null, "price_per_km" numeric(10,2) not null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "tariffs_pkey" primary key ("id"));`);
    this.addSql(`create index "tariffs_is_active_index" on "tariffs" ("is_active");`);

    this.addSql(`create table "weight_coefficients" ("id" uuid not null, "min_kg" int not null, "max_kg" int not null, "coefficient" numeric(5,2) not null, constraint "weight_coefficients_pkey" primary key ("id"), constraint weight_coefficients_check check (min_kg <= max_kg));`);

    this.addSql(`alter table "city_distances" add constraint "city_distances_from_city_id_foreign" foreign key ("from_city_id") references "cities" ("id") on update cascade;`);
    this.addSql(`alter table "city_distances" add constraint "city_distances_to_city_id_foreign" foreign key ("to_city_id") references "cities" ("id") on update cascade;`);

    this.addSql(`drop table if exists "invitation_link" cascade;`);

    this.addSql(`alter table "user" alter column "roles" type "role"[] using ("roles"::"role"[]);`);
    this.addSql(`alter table "user" alter column "roles" set default '{customer}';`);

    this.addSql(`alter table "employee" add column "role" text check ("role" in ('driver', 'waiter', 'manager', 'chef', 'kitchener', 'cleaner')) not null;`);
  }

}
