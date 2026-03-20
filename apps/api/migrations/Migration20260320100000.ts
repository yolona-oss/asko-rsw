import { Migration } from '@mikro-orm/migrations';

export class Migration20260320100000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "repair_request" add column "steps_locked" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "repair_request" drop column "steps_locked";`);
  }

}
