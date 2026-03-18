import { Migration } from '@mikro-orm/migrations';

export class Migration20260318190613 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "device" add column "slug" varchar(255);`);

    // Generate slugs for existing rows from brand + model
    this.addSql(`
      update "device"
      set "slug" = lower(
        regexp_replace(
          regexp_replace(
            concat("brand", '-', "model"),
            '[^a-zA-Z0-9а-яёА-ЯЁ]+', '-', 'g'
          ),
          '^-+|-+$', '', 'g'
        )
      ) || '-' || left("id", 8);
    `);

    this.addSql(`alter table "device" alter column "slug" set not null;`);
    this.addSql(`alter table "device" add constraint "device_slug_unique" unique ("slug");`);
    this.addSql(`alter table "device" drop column "link";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "device" drop constraint "device_slug_unique";`);
    this.addSql(`alter table "device" drop column "slug";`);

    this.addSql(`alter table "device" add column "link" varchar(500) null;`);
  }

}
