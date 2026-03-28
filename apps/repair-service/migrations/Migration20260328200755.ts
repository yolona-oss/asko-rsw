import { Migration } from '@mikro-orm/migrations';

export class Migration20260328200755 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "address" add column "building" varchar(50) null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "address" drop column "building";`);
  }

}
