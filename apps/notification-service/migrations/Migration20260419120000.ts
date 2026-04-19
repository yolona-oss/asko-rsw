import { Migration } from '@mikro-orm/migrations';

export class Migration20260419120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "notification" add column "urgency" varchar(20) not null default 'normal';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "notification" drop column "urgency";`);
  }

}
