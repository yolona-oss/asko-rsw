import { Migration } from '@mikro-orm/migrations';

export class Migration20260414120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "repair_request" add column "avr_status" varchar(255) not null default 'none';`);
    this.addSql(`alter table "repair_request" add column "avr_signing_method" varchar(20) null;`);
    this.addSql(`alter table "repair_request" add column "avr_document_id" varchar(255) null;`);
    this.addSql(`alter table "repair_request" add column "avr_signed_document_id" varchar(255) null;`);
    this.addSql(`alter table "repair_request" add column "avr_signed_at" timestamptz null;`);
    this.addSql(`alter table "repair_request" add column "avr_signed_payload" text null;`);
    this.addSql(`alter table "repair_request" add column "avr_signature" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "repair_request" drop column "avr_status";`);
    this.addSql(`alter table "repair_request" drop column "avr_signing_method";`);
    this.addSql(`alter table "repair_request" drop column "avr_document_id";`);
    this.addSql(`alter table "repair_request" drop column "avr_signed_document_id";`);
    this.addSql(`alter table "repair_request" drop column "avr_signed_at";`);
    this.addSql(`alter table "repair_request" drop column "avr_signed_payload";`);
    this.addSql(`alter table "repair_request" drop column "avr_signature";`);
  }

}
