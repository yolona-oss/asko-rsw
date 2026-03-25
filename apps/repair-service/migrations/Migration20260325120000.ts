import { Migration } from '@mikro-orm/migrations';

export class Migration20260325120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter type "repair_request_status" add value if not exists 'paused';`);
    this.addSql(`alter table "repair_request" add column "status_before_pause" varchar(255) null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "repair_request" drop column "status_before_pause";`);
  }

}
