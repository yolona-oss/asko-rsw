import { Migration } from '@mikro-orm/migrations';

export class Migration20260410214900 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter type "work_step_status" add value if not exists 'declined';`);

    this.addSql(`alter table "work_step" add column "comment" text null, add column "is_mandatory" boolean not null default false, add column "declined_at" timestamptz null, add column "declined_by_repairer_id" varchar(255) null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "work_step" drop column "comment", drop column "is_mandatory", drop column "declined_at", drop column "declined_by_repairer_id";`);
  }

}
