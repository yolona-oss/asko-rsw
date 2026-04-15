import { Migration } from '@mikro-orm/migrations';

export class Migration20260415170400 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "device_part" drop constraint "device_part_device_id_foreign";`);

    this.addSql(`alter table "address" add column "district" varchar(255) null, add column "is_primary" boolean not null default false;`);

    this.addSql(`alter table "device_part" add constraint "device_part_device_id_foreign" foreign key ("device_id") references "device" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "points_withdrawal" add column "card_number" varchar(20) null, add column "card_holder_name" varchar(255) null;`);

    this.addSql(`alter table "repair_request" add column "schedule_end_notified_at" timestamptz null, add column "schedule_end_confirmed_at" timestamptz null;`);
    this.addSql(`alter table "repair_request" alter column "avr_status" type text using ("avr_status"::text);`);
    this.addSql(`alter table "repair_request" add constraint "repair_request_avr_status_check" check("avr_status" in ('none', 'generated', 'pending_signature', 'signed_digital', 'signed_offline'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "device_part" drop constraint "device_part_device_id_foreign";`);

    this.addSql(`alter table "repair_request" drop constraint if exists "repair_request_avr_status_check";`);

    this.addSql(`alter table "address" drop column "district", drop column "is_primary";`);

    this.addSql(`alter table "device_part" add constraint "device_part_device_id_foreign" foreign key ("device_id") references "device" ("id") on update cascade on delete no action;`);

    this.addSql(`alter table "points_withdrawal" drop column "card_number", drop column "card_holder_name";`);

    this.addSql(`alter table "repair_request" drop column "schedule_end_notified_at", drop column "schedule_end_confirmed_at";`);

    this.addSql(`alter table "repair_request" alter column "avr_status" type varchar(255) using ("avr_status"::varchar(255));`);
  }

}
