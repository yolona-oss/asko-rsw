import { Migration } from '@mikro-orm/migrations';

export class Migration20260411120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "repair_request" add column "certificate_valid" boolean not null default true;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "repair_request" drop column "certificate_valid";`);
  }

}
