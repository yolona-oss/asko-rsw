import { Migration } from '@mikro-orm/migrations';

export class Migration20260411000000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "repair_request" drop column "rejected_repairers";`);
    this.addSql(`alter table "work_step" add column "completed_by_repairer_id" varchar(255) null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "work_step" drop column "completed_by_repairer_id";`);
    this.addSql(`alter table "repair_request" add column "rejected_repairers" jsonb null;`);
  }

}
