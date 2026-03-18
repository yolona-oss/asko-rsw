import { Migration } from '@mikro-orm/migrations';

export class Migration20260318200000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "repair_request" add column "rejected_repairers" jsonb null;`);
    this.addSql(`alter table "repair_request" add column "completion_note" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "repair_request" drop column "rejected_repairers";`);
    this.addSql(`alter table "repair_request" drop column "completion_note";`);
  }

}
