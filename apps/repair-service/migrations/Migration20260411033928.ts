import { Migration } from '@mikro-orm/migrations';

export class Migration20260411033928 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "broken_part" add column "external_order_id" varchar(64) null, add column "supplier_provider" varchar(32) null, add column "ordered_at" timestamptz null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "broken_part" drop column "external_order_id", drop column "supplier_provider", drop column "ordered_at";`);
  }

}
