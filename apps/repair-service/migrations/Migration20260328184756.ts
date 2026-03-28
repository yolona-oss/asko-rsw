import { Migration } from '@mikro-orm/migrations';

export class Migration20260328184756 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "address" add column "latitude" real null, add column "longitude" real null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "address" drop column "latitude", drop column "longitude";`);
  }

}
