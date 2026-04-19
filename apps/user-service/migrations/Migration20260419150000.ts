import { Migration } from '@mikro-orm/migrations';

export class Migration20260419150000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "user_settings" add column "privacy_rules" jsonb default null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user_settings" drop column "privacy_rules";`);
  }

}
