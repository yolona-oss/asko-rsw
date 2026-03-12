import { Migration } from '@mikro-orm/migrations';

export class Migration20260312111706 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create type "device_type" as enum ('washing_machine', 'dryer', 'dishwasher', 'oven', 'cooktop', 'refrigerator', 'freezer', 'hood', 'other');`);
    this.addSql(`create type "withdrawal_status" as enum ('pending', 'approved', 'rejected', 'completed');`);
    this.addSql(`create type "certificate_status" as enum ('pending_approval', 'active', 'expired', 'revoked');`);
    this.addSql(`create type "repair_request_status" as enum ('pending', 'paid', 'assigned', 'accepted', 'in_progress', 'awaiting_completion', 'completed', 'refused', 'cancelled', 'refund_requested', 'refunded');`);
    this.addSql(`create type "payment_status" as enum ('pending', 'paid', 'refunded', 'failed');`);
    this.addSql(`create type "points_transaction_type" as enum ('earned', 'spent', 'adjustment');`);
    this.addSql(`create type "work_step_status" as enum ('pending', 'in_progress', 'completed', 'skipped');`);
    this.addSql(`create table "device" ("id" varchar(255) not null, "name" varchar(255) not null, "type" "device_type" not null, "model" varchar(255) not null, "brand" varchar(255) not null, "description" text null, "specifications" jsonb null, "link" varchar(500) null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "device_pkey" primary key ("id"));`);

    this.addSql(`create table "repairer" ("id" varchar(255) not null, "user_id" varchar(255) not null, "specializations" text[] not null default '{}', "city" varchar(255) not null, "is_active" boolean not null default true, "rating" real not null default 0, "completed_repairs" int not null default 0, "latitude" real null, "longitude" real null, "last_location_update" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "repairer_pkey" primary key ("id"));`);

    this.addSql(`create table "dealer_profile" ("id" varchar(255) not null, "user_id" varchar(255) not null, "company_name" varchar(255) null, "inn" varchar(20) null, "points_balance" int not null default 0, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "dealer_profile_pkey" primary key ("id"));`);

    this.addSql(`create table "points_withdrawal" ("id" varchar(255) not null, "dealer_id" varchar(255) not null, "amount" int not null, "status" "withdrawal_status" not null default 'pending', "requested_at" timestamptz not null, "processed_at" timestamptz null, "processed_by_id" varchar(255) null, constraint "points_withdrawal_pkey" primary key ("id"));`);

    this.addSql(`create table "dealer_client" ("id" varchar(255) not null, "dealer_id" varchar(255) not null, "client_user_id" varchar(255) not null, "created_at" timestamptz not null, constraint "dealer_client_pkey" primary key ("id"));`);

    this.addSql(`create table "user_device" ("id" varchar(255) not null, "user_id" varchar(255) not null, "device_id" varchar(255) not null, "serial_number" varchar(255) not null, "address_id" uuid not null, "purchase_date" date null, "warranty_until" date null, "notes" text null, "created_at" timestamptz not null, constraint "user_device_pkey" primary key ("id"));`);

    this.addSql(`create table "certificate" ("id" varchar(255) not null, "user_id" varchar(255) not null, "user_device_id" varchar(255) not null, "dealer_id" varchar(255) null, "certificate_number" varchar(100) not null, "status" "certificate_status" not null default 'pending_approval', "issued_at" timestamptz not null, "expires_at" timestamptz not null, "purchase_receipt_url" varchar(500) null, "description" text null, "created_at" timestamptz not null, constraint "certificate_pkey" primary key ("id"));`);
    this.addSql(`alter table "certificate" add constraint "certificate_certificate_number_unique" unique ("certificate_number");`);

    this.addSql(`create table "repair_request" ("id" varchar(255) not null, "user_id" varchar(255) not null, "user_device_id" varchar(255) not null, "repairer_id" varchar(255) null, "manager_id" varchar(255) null, "certificate_id" varchar(255) null, "status" "repair_request_status" not null default 'pending', "description" text not null, "preferred_date" timestamptz null, "address_id" uuid null, "total_cost" real null, "refund_requested" boolean not null default false, "refund_reason" text null, "refuse_reason" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "repair_request_pkey" primary key ("id"));`);

    this.addSql(`create table "review" ("id" varchar(255) not null, "repair_request_id" varchar(255) not null, "user_id" varchar(255) not null, "repairer_id" varchar(255) not null, "rating" int not null, "comment" text null, "created_at" timestamptz not null, constraint "review_pkey" primary key ("id"));`);

    this.addSql(`create table "repair_payment" ("id" varchar(255) not null, "repair_request_id" varchar(255) not null, "amount" real not null, "currency" varchar(10) not null default 'rub', "status" "payment_status" not null default 'pending', "provider" varchar(255) null, "provider_payment_id" varchar(255) null, "paid_at" timestamptz null, "created_at" timestamptz not null, constraint "repair_payment_pkey" primary key ("id"));`);

    this.addSql(`create table "points_transaction" ("id" varchar(255) not null, "dealer_id" varchar(255) not null, "type" "points_transaction_type" not null, "amount" int not null, "reason" varchar(500) not null, "repair_request_id" varchar(255) null, "created_at" timestamptz not null, constraint "points_transaction_pkey" primary key ("id"));`);

    this.addSql(`create table "work_step" ("id" varchar(255) not null, "repair_request_id" varchar(255) not null, "title" varchar(255) not null, "description" text null, "status" "work_step_status" not null default 'pending', "order" int not null, "is_final" boolean not null default false, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "work_step_pkey" primary key ("id"));`);

    this.addSql(`alter table "repairer" add constraint "repairer_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`);

    this.addSql(`alter table "dealer_profile" add constraint "dealer_profile_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`);

    this.addSql(`alter table "points_withdrawal" add constraint "points_withdrawal_dealer_id_foreign" foreign key ("dealer_id") references "dealer_profile" ("id") on update cascade;`);
    this.addSql(`alter table "points_withdrawal" add constraint "points_withdrawal_processed_by_id_foreign" foreign key ("processed_by_id") references "user" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "dealer_client" add constraint "dealer_client_dealer_id_foreign" foreign key ("dealer_id") references "dealer_profile" ("id") on update cascade;`);
    this.addSql(`alter table "dealer_client" add constraint "dealer_client_client_user_id_foreign" foreign key ("client_user_id") references "user" ("id") on update cascade;`);

    this.addSql(`alter table "user_device" add constraint "user_device_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`);
    this.addSql(`alter table "user_device" add constraint "user_device_device_id_foreign" foreign key ("device_id") references "device" ("id") on update cascade;`);
    this.addSql(`alter table "user_device" add constraint "user_device_address_id_foreign" foreign key ("address_id") references "address" ("id") on update cascade;`);

    this.addSql(`alter table "certificate" add constraint "certificate_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`);
    this.addSql(`alter table "certificate" add constraint "certificate_user_device_id_foreign" foreign key ("user_device_id") references "user_device" ("id") on update cascade;`);
    this.addSql(`alter table "certificate" add constraint "certificate_dealer_id_foreign" foreign key ("dealer_id") references "dealer_profile" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "repair_request" add constraint "repair_request_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`);
    this.addSql(`alter table "repair_request" add constraint "repair_request_user_device_id_foreign" foreign key ("user_device_id") references "user_device" ("id") on update cascade;`);
    this.addSql(`alter table "repair_request" add constraint "repair_request_repairer_id_foreign" foreign key ("repairer_id") references "repairer" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "repair_request" add constraint "repair_request_manager_id_foreign" foreign key ("manager_id") references "user" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "repair_request" add constraint "repair_request_certificate_id_foreign" foreign key ("certificate_id") references "certificate" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "repair_request" add constraint "repair_request_address_id_foreign" foreign key ("address_id") references "address" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "review" add constraint "review_repair_request_id_foreign" foreign key ("repair_request_id") references "repair_request" ("id") on update cascade;`);
    this.addSql(`alter table "review" add constraint "review_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`);
    this.addSql(`alter table "review" add constraint "review_repairer_id_foreign" foreign key ("repairer_id") references "repairer" ("id") on update cascade;`);

    this.addSql(`alter table "repair_payment" add constraint "repair_payment_repair_request_id_foreign" foreign key ("repair_request_id") references "repair_request" ("id") on update cascade;`);

    this.addSql(`alter table "points_transaction" add constraint "points_transaction_dealer_id_foreign" foreign key ("dealer_id") references "dealer_profile" ("id") on update cascade;`);
    this.addSql(`alter table "points_transaction" add constraint "points_transaction_repair_request_id_foreign" foreign key ("repair_request_id") references "repair_request" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "work_step" add constraint "work_step_repair_request_id_foreign" foreign key ("repair_request_id") references "repair_request" ("id") on update cascade;`);

    this.addSql(`alter table "image" drop constraint if exists "image_owner_type_check";`);
    this.addSql(`alter table "image" drop constraint if exists "image_blank_type_check";`);

    this.addSql(`alter table "invitation_link" drop constraint if exists "invitation_link_role_check";`);

    this.addSql(`alter table "image" add constraint "image_owner_type_check" check("owner_type" in ('user', 'product', 'category', 'device', 'repair_request', 'certificate'));`);
    this.addSql(`alter table "image" add constraint "image_blank_type_check" check("blank_type" in ('user', 'product', 'category', 'device', 'repair_request', 'certificate'));`);

    this.addSql(`alter table "invitation_link" add constraint "invitation_link_role_check" check("role" in ('super_admin', 'admin', 'dealer', 'manager', 'repairer', 'user'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user_device" drop constraint "user_device_device_id_foreign";`);

    this.addSql(`alter table "repair_request" drop constraint "repair_request_repairer_id_foreign";`);

    this.addSql(`alter table "review" drop constraint "review_repairer_id_foreign";`);

    this.addSql(`alter table "points_withdrawal" drop constraint "points_withdrawal_dealer_id_foreign";`);

    this.addSql(`alter table "dealer_client" drop constraint "dealer_client_dealer_id_foreign";`);

    this.addSql(`alter table "certificate" drop constraint "certificate_dealer_id_foreign";`);

    this.addSql(`alter table "points_transaction" drop constraint "points_transaction_dealer_id_foreign";`);

    this.addSql(`alter table "certificate" drop constraint "certificate_user_device_id_foreign";`);

    this.addSql(`alter table "repair_request" drop constraint "repair_request_user_device_id_foreign";`);

    this.addSql(`alter table "repair_request" drop constraint "repair_request_certificate_id_foreign";`);

    this.addSql(`alter table "review" drop constraint "review_repair_request_id_foreign";`);

    this.addSql(`alter table "repair_payment" drop constraint "repair_payment_repair_request_id_foreign";`);

    this.addSql(`alter table "points_transaction" drop constraint "points_transaction_repair_request_id_foreign";`);

    this.addSql(`alter table "work_step" drop constraint "work_step_repair_request_id_foreign";`);

    this.addSql(`drop table if exists "device" cascade;`);

    this.addSql(`drop table if exists "repairer" cascade;`);

    this.addSql(`drop table if exists "dealer_profile" cascade;`);

    this.addSql(`drop table if exists "points_withdrawal" cascade;`);

    this.addSql(`drop table if exists "dealer_client" cascade;`);

    this.addSql(`drop table if exists "user_device" cascade;`);

    this.addSql(`drop table if exists "certificate" cascade;`);

    this.addSql(`drop table if exists "repair_request" cascade;`);

    this.addSql(`drop table if exists "review" cascade;`);

    this.addSql(`drop table if exists "repair_payment" cascade;`);

    this.addSql(`drop table if exists "points_transaction" cascade;`);

    this.addSql(`drop table if exists "work_step" cascade;`);

    this.addSql(`alter table "image" drop constraint if exists "image_owner_type_check";`);
    this.addSql(`alter table "image" drop constraint if exists "image_blank_type_check";`);

    this.addSql(`alter table "invitation_link" drop constraint if exists "invitation_link_role_check";`);

    this.addSql(`alter table "image" add constraint "image_owner_type_check" check("owner_type" in ('user', 'product', 'category'));`);
    this.addSql(`alter table "image" add constraint "image_blank_type_check" check("blank_type" in ('user', 'product', 'category'));`);

    this.addSql(`alter table "invitation_link" add constraint "invitation_link_role_check" check("role" in ('super_admin', 'admin', 'dealer', 'manager', 'user'));`);

    this.addSql(`drop type "device_type";`);
    this.addSql(`drop type "withdrawal_status";`);
    this.addSql(`drop type "certificate_status";`);
    this.addSql(`drop type "repair_request_status";`);
    this.addSql(`drop type "payment_status";`);
    this.addSql(`drop type "points_transaction_type";`);
    this.addSql(`drop type "work_step_status";`);
  }

}
