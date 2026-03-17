import { Migration } from '@mikro-orm/migrations';

export class Migration20260317193236 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "image" drop constraint if exists "image_owner_type_check";`);
    this.addSql(`alter table "image" drop constraint if exists "image_blank_type_check";`);

    this.addSql(`alter table "device" add column "features" jsonb null, add column "is_featured" boolean null default false;`);

    this.addSql(`alter table "image" add constraint "image_owner_type_check" check("owner_type" in ('user', 'product', 'category', 'device', 'repair_request', 'certificate', 'review'));`);
    this.addSql(`alter table "image" add constraint "image_blank_type_check" check("blank_type" in ('user', 'product', 'category', 'device', 'repair_request', 'certificate', 'review'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "image" drop constraint if exists "image_owner_type_check";`);
    this.addSql(`alter table "image" drop constraint if exists "image_blank_type_check";`);

    this.addSql(`alter table "device" drop column "features", drop column "is_featured";`);

    this.addSql(`alter table "image" add constraint "image_owner_type_check" check("owner_type" in ('user', 'product', 'category', 'device', 'repair_request', 'certificate'));`);
    this.addSql(`alter table "image" add constraint "image_blank_type_check" check("blank_type" in ('user', 'product', 'category', 'device', 'repair_request', 'certificate'));`);
  }

}
