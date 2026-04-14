import { Migration } from '@mikro-orm/migrations';

export class Migration20260415140000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "device_part" add column "group" varchar(255) null;`);
    this.addSql(`alter table "device_part" add column "category_id" varchar(255) null;`);
    this.addSql(`alter table "device_part" add constraint "device_part_category_id_foreign" foreign key ("category_id") references "device_category" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "device_part" drop constraint "device_part_category_id_foreign";`);
    this.addSql(`alter table "device_part" drop column "category_id";`);
    this.addSql(`alter table "device_part" drop column "group";`);
  }

}
