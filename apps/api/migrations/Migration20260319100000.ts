import { Migration } from '@mikro-orm/migrations';

export class Migration20260319100000 extends Migration {

  override async up(): Promise<void> {
    // Add price field to device
    this.addSql(`alter table "device" add column "price" real null;`);

    // Add price and paid fields to certificate
    this.addSql(`alter table "certificate" add column "price" real null;`);
    this.addSql(`alter table "certificate" add column "paid" boolean not null default false;`);

    // Add pending_payment to certificate_status enum
    this.addSql(`alter type "certificate_status" add value if not exists 'pending_payment' before 'pending_approval';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "device" drop column "price";`);
    this.addSql(`alter table "certificate" drop column "price";`);
    this.addSql(`alter table "certificate" drop column "paid";`);
  }

}
