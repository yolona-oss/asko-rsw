import { Migration } from '@mikro-orm/migrations';

export class Migration20260415120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "device_part" alter column "device_id" drop not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`delete from "device_part" where "device_id" is null;`);
    this.addSql(`alter table "device_part" alter column "device_id" set not null;`);
  }

}
