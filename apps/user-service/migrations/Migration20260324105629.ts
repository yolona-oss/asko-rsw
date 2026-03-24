import { Migration } from '@mikro-orm/migrations';

export class Migration20260324105629 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create type "role" as enum ('super_admin', 'admin', 'dealer', 'manager', 'repairer', 'user');`);
    this.addSql(`create table "user" ("id" varchar(255) not null, "first_name" varchar(255) null, "last_name" varchar(255) null, "email" varchar(255) null, "password_hash" varchar(255) null, "phone" varchar(255) null, "roles" "role"[] not null default '{user}', "preferences" jsonb null, "providers" text[] not null default '{EMAIL}', "google_id" varchar(255) null, "email_verified" boolean not null default false, "phone_verified" boolean not null default false, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "user_pkey" primary key ("id"));`);
    this.addSql(`alter table "user" add constraint "user_email_unique" unique ("email");`);
    this.addSql(`alter table "user" add constraint "user_phone_unique" unique ("phone");`);

    this.addSql(`create table "session" ("id" uuid not null, "user_id" varchar(255) not null, "type" text check ("type" in ('ACCESS', 'REFRESH', 'RESET_PASSWORD', 'VERIFY_EMAIL')) not null default 'REFRESH', "token" varchar(255) not null, "device_info" varchar(255) not null, "ip_address" varchar(255) not null, "expires_at" timestamptz not null, "created_at" timestamptz not null, constraint "session_pkey" primary key ("id"));`);

    this.addSql(`create table "invitation_link" ("id" uuid not null, "token" varchar(255) not null, "role" text check ("role" in ('super_admin', 'admin', 'dealer', 'manager', 'repairer', 'user')) not null, "ttl" int not null, "used" boolean not null default false, "created_by_id" varchar(255) not null, "expires_at" timestamptz not null, "created_at" timestamptz not null, constraint "invitation_link_pkey" primary key ("id"));`);
    this.addSql(`comment on column "invitation_link"."ttl" is 'TTL in seconds';`);
    this.addSql(`alter table "invitation_link" add constraint "invitation_link_token_unique" unique ("token");`);

    this.addSql(`create table "user_address" ("id" serial primary key, "user_id" varchar(255) not null, "address_id" int null, "is_primary" boolean not null default false);`);

    this.addSql(`alter table "session" add constraint "session_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`);

    this.addSql(`alter table "invitation_link" add constraint "invitation_link_created_by_id_foreign" foreign key ("created_by_id") references "user" ("id") on update cascade;`);

    this.addSql(`alter table "user_address" add constraint "user_address_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`);

    this.addSql(`drop table if exists "image" cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "session" drop constraint "session_user_id_foreign";`);

    this.addSql(`alter table "invitation_link" drop constraint "invitation_link_created_by_id_foreign";`);

    this.addSql(`alter table "user_address" drop constraint "user_address_user_id_foreign";`);

    this.addSql(`create table "image" ("id" uuid not null, "image" jsonb not null, "alt" varchar(255) null, "order" int4 not null default 0, "owner_type" text check ("owner_type" in ('user', 'product', 'category', 'device', 'article', 'repair_request', 'certificate', 'review')) null, "owner_id" varchar(255) null, "created_at" timestamptz(6) not null, "updated_at" timestamptz(6) not null, constraint "image_pkey" primary key ("id"));`);

    this.addSql(`drop table if exists "user" cascade;`);

    this.addSql(`drop table if exists "session" cascade;`);

    this.addSql(`drop table if exists "invitation_link" cascade;`);

    this.addSql(`drop table if exists "user_address" cascade;`);

    this.addSql(`drop type "role";`);
  }

}
