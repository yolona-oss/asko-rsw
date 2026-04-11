import { Migration } from '@mikro-orm/migrations';

export class Migration20260410233133 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create type "withdrawal_status" as enum ('pending', 'approved', 'rejected', 'completed');`);
    this.addSql(`create type "certificate_status" as enum ('pending_payment', 'validation_error', 'active', 'expired', 'revoked');`);
    this.addSql(`create type "repair_request_status" as enum ('pending', 'paid', 'assigned', 'accepted', 'in_progress', 'awaiting_completion', 'completed', 'refused', 'cancelled', 'paused', 'refund_requested', 'refunded');`);
    this.addSql(`create type "points_transaction_type" as enum ('earned', 'spent', 'adjustment');`);
    this.addSql(`create type "broken_part_status" as enum ('added', 'ordered', 'shipped', 'replaced');`);
    this.addSql(`create type "work_step_status" as enum ('pending', 'in_progress', 'completed', 'skipped', 'declined');`);
    this.addSql(`create table "address" ("id" varchar(255) not null, "user_id" varchar(255) not null, "city" varchar(255) not null, "street" varchar(255) not null, "house" varchar(50) not null, "building" varchar(50) null, "apartment" varchar(50) null, "entrance" varchar(50) null, "floor" varchar(50) null, "intercom" varchar(50) null, "comment" text null, "latitude" real null, "longitude" real null, "validation_status" varchar(20) not null default 'pending', "validation_error" text null, "created_at" timestamptz not null, constraint "address_pkey" primary key ("id"));`);

    this.addSql(`create table "dealer_profile" ("id" varchar(255) not null, "user_id" varchar(255) not null, "company_name" varchar(255) null, "inn" varchar(50) null, "points_balance" int not null default 0, "created_at" timestamptz not null, "updated_at" timestamptz not null, "agreement_signature" text null, "agreement_signed_payload" text null, constraint "dealer_profile_pkey" primary key ("id"));`);

    this.addSql(`create table "dealer_client" ("id" varchar(255) not null, "dealer_id" varchar(255) not null, "client_user_id" varchar(255) not null, "created_at" timestamptz not null, constraint "dealer_client_pkey" primary key ("id"));`);

    this.addSql(`create table "device_category" ("id" varchar(255) not null, "name" varchar(255) not null, "label" varchar(255) not null, "label_plural" varchar(255) not null, "order" int not null default 0, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "device_category_pkey" primary key ("id"));`);
    this.addSql(`alter table "device_category" add constraint "device_category_name_unique" unique ("name");`);

    this.addSql(`create table "device" ("id" varchar(255) not null, "name" varchar(255) not null, "category_id" varchar(255) not null, "model" varchar(255) not null, "brand" varchar(255) not null, "price" real null, "description" text null, "specifications" jsonb null, "features" jsonb null, "slug" varchar(255) not null, "is_featured" boolean null default false, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "device_pkey" primary key ("id"));`);
    this.addSql(`alter table "device" add constraint "device_slug_unique" unique ("slug");`);

    this.addSql(`create table "device_part" ("id" varchar(255) not null, "device_id" varchar(255) not null, "name" varchar(255) not null, "part_number" varchar(255) null, "price" real null, "description" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "device_part_pkey" primary key ("id"));`);

    this.addSql(`create table "points_withdrawal" ("id" varchar(255) not null, "dealer_id" varchar(255) not null, "amount" int not null, "status" "withdrawal_status" not null default 'pending', "requested_at" timestamptz not null, "processed_at" timestamptz null, "processed_by_user_id" varchar(255) null, constraint "points_withdrawal_pkey" primary key ("id"));`);

    this.addSql(`create table "repairer" ("id" varchar(255) not null, "user_id" varchar(255) not null, "specializations" text[] not null default '{}', "city" varchar(255) not null, "is_active" boolean not null default true, "completed_repairs" int not null default 0, "latitude" real null, "longitude" real null, "last_location_update" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "repairer_pkey" primary key ("id"));`);

    this.addSql(`create table "user_device" ("id" varchar(255) not null, "user_id" varchar(255) not null, "device_id" varchar(255) not null, "serial_number" varchar(255) not null, "address_id" varchar(255) not null, "purchase_date" date null, "warranty_until" date null, "notes" text null, "created_at" timestamptz not null, "registration_signature" text null, "registration_signed_payload" text null, constraint "user_device_pkey" primary key ("id"));`);

    this.addSql(`create table "certificate" ("id" varchar(255) not null, "certificate_number" varchar(255) not null, "user_id" varchar(255) not null, "user_device_id" varchar(255) not null, "dealer_id" varchar(255) null, "status" "certificate_status" not null default 'pending_payment', "issued_at" timestamptz not null, "expires_at" timestamptz not null, "price" real null, "paid" boolean not null default false, "points_awarded" boolean not null default false, "purchase_receipt_url" varchar(500) null, "description" text null, "created_at" timestamptz not null, "signature" text null, "signed_payload" text null, "expiry_reminder_sent" boolean not null default false, "expiry_reminder_dismissed" boolean not null default false, "replaced_certificate_id" varchar(255) null, constraint "certificate_pkey" primary key ("id"));`);
    this.addSql(`alter table "certificate" add constraint "certificate_certificate_number_unique" unique ("certificate_number");`);

    this.addSql(`create table "repair_request" ("id" varchar(255) not null, "user_id" varchar(255) not null, "user_device_id" varchar(255) not null, "repairer_id" varchar(255) null, "manager_id" varchar(255) null, "certificate_id" varchar(255) null, "address_id" varchar(255) null, "status" "repair_request_status" not null default 'pending', "description" text not null, "preferred_date" timestamptz null, "total_cost" real null, "refund_requested" boolean not null default false, "refund_reason" text null, "refuse_reason" text null, "completion_note" text null, "status_before_pause" varchar(255) null, "conversation_id" varchar(255) null, "chat_close_at" timestamptz null, "steps_locked" boolean not null default false, "certificate_valid" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, "completion_signature" text null, "completion_signed_payload" text null, "acceptance_signature" text null, "acceptance_signed_payload" text null, constraint "repair_request_pkey" primary key ("id"));`);

    this.addSql(`create table "review" ("id" varchar(255) not null, "repair_request_id" varchar(255) not null, "user_id" varchar(255) not null, "repairer_id" varchar(255) not null, "rating" int not null, "comment" text null, "created_at" timestamptz not null, constraint "review_pkey" primary key ("id"));`);

    this.addSql(`create table "points_transaction" ("id" varchar(255) not null, "dealer_id" varchar(255) not null, "type" "points_transaction_type" not null, "amount" int not null, "reason" varchar(500) not null, "repair_request_id" varchar(255) null, "created_at" timestamptz not null, constraint "points_transaction_pkey" primary key ("id"));`);

    this.addSql(`create table "broken_part" ("id" varchar(255) not null, "repair_request_id" varchar(255) not null, "device_part_id" varchar(255) null, "name" varchar(255) not null, "status" "broken_part_status" not null default 'added', "note" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "broken_part_pkey" primary key ("id"));`);

    this.addSql(`create table "work_step" ("id" varchar(255) not null, "repair_request_id" varchar(255) not null, "title" varchar(255) not null, "description" text null, "comment" text null, "status" "work_step_status" not null default 'pending', "order" int not null, "is_final" boolean not null default false, "is_mandatory" boolean not null default false, "declined_at" timestamptz null, "declined_by_repairer_id" varchar(255) null, "completed_by_repairer_id" varchar(255) null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "work_step_pkey" primary key ("id"));`);

    this.addSql(`create table "wschedule" ("id" uuid not null, "user_id" varchar(255) not null, "type" text check ("type" in ('work', 'vacation', 'sick_leave', 'overtime', 'extra_day')) not null, "day_of_week" int null, "date" date null, "start_time" varchar(5) not null, "end_time" varchar(5) not null, "status" text check ("status" in ('pending', 'approved', 'rejected')) not null default 'pending', "approved_by" varchar(255) null, "note" text null, "auto_generated" boolean not null default false, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "wschedule_pkey" primary key ("id"));`);

    this.addSql(`alter table "dealer_client" add constraint "dealer_client_dealer_id_foreign" foreign key ("dealer_id") references "dealer_profile" ("id") on update cascade;`);

    this.addSql(`alter table "device" add constraint "device_category_id_foreign" foreign key ("category_id") references "device_category" ("id") on update cascade;`);

    this.addSql(`alter table "device_part" add constraint "device_part_device_id_foreign" foreign key ("device_id") references "device" ("id") on update cascade;`);

    this.addSql(`alter table "points_withdrawal" add constraint "points_withdrawal_dealer_id_foreign" foreign key ("dealer_id") references "dealer_profile" ("id") on update cascade;`);

    this.addSql(`alter table "user_device" add constraint "user_device_device_id_foreign" foreign key ("device_id") references "device" ("id") on update cascade;`);
    this.addSql(`alter table "user_device" add constraint "user_device_address_id_foreign" foreign key ("address_id") references "address" ("id") on update cascade;`);

    this.addSql(`alter table "certificate" add constraint "certificate_user_device_id_foreign" foreign key ("user_device_id") references "user_device" ("id") on update cascade;`);
    this.addSql(`alter table "certificate" add constraint "certificate_dealer_id_foreign" foreign key ("dealer_id") references "dealer_profile" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "certificate" add constraint "certificate_replaced_certificate_id_foreign" foreign key ("replaced_certificate_id") references "certificate" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "repair_request" add constraint "repair_request_user_device_id_foreign" foreign key ("user_device_id") references "user_device" ("id") on update cascade;`);
    this.addSql(`alter table "repair_request" add constraint "repair_request_repairer_id_foreign" foreign key ("repairer_id") references "repairer" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "repair_request" add constraint "repair_request_certificate_id_foreign" foreign key ("certificate_id") references "certificate" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "repair_request" add constraint "repair_request_address_id_foreign" foreign key ("address_id") references "address" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "review" add constraint "review_repair_request_id_foreign" foreign key ("repair_request_id") references "repair_request" ("id") on update cascade;`);
    this.addSql(`alter table "review" add constraint "review_repairer_id_foreign" foreign key ("repairer_id") references "repairer" ("id") on update cascade;`);

    this.addSql(`alter table "points_transaction" add constraint "points_transaction_dealer_id_foreign" foreign key ("dealer_id") references "dealer_profile" ("id") on update cascade;`);
    this.addSql(`alter table "points_transaction" add constraint "points_transaction_repair_request_id_foreign" foreign key ("repair_request_id") references "repair_request" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "broken_part" add constraint "broken_part_repair_request_id_foreign" foreign key ("repair_request_id") references "repair_request" ("id") on update cascade;`);
    this.addSql(`alter table "broken_part" add constraint "broken_part_device_part_id_foreign" foreign key ("device_part_id") references "device_part" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "work_step" add constraint "work_step_repair_request_id_foreign" foreign key ("repair_request_id") references "repair_request" ("id") on update cascade;`);
  }

}
