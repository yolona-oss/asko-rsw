import { Migration } from '@mikro-orm/migrations';

export class Migration20260411044553 extends Migration {

  override async up(): Promise<void> {
    // The user_settings.user_id column was created as a second FK edge
    // but MikroORM doesn't manage it (User.settings is the owning side via
    // user.settings_id). That caused NOT NULL violations on insert.
    // Drop it; cascade remove is handled at the ORM layer via Cascade.REMOVE.
    this.addSql(`ALTER TABLE "user_settings" DROP CONSTRAINT IF EXISTS "user_settings_user_id_key";`);
    this.addSql(`ALTER TABLE "user_settings" DROP CONSTRAINT IF EXISTS "user_settings_user_id_fkey";`);
    this.addSql(`ALTER TABLE "user_settings" DROP COLUMN IF EXISTS "user_id";`);
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "user_settings" ADD COLUMN "user_id" varchar(255) NULL;`);
    this.addSql(`UPDATE "user_settings" s SET user_id = u.id FROM "user" u WHERE u.settings_id = s.id;`);
    this.addSql(`ALTER TABLE "user_settings" ALTER COLUMN "user_id" SET NOT NULL;`);
    this.addSql(`ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_key" UNIQUE ("user_id");`);
    this.addSql(`ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;`);
  }

}
