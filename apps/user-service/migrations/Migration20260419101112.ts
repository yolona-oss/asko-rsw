import { Migration } from '@mikro-orm/migrations';

export class Migration20260419101112 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`drop index "idx_user_settings_id";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user" add constraint "idx_user_settings_id" unique ("settings_id");`);
  }

}
