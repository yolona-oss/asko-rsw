import { Migration } from '@mikro-orm/migrations';

export class Migration20260418230000 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`ALTER TABLE "user_settings" ADD COLUMN "language" VARCHAR(5) NOT NULL DEFAULT 'ru';`);
    }

    override async down(): Promise<void> {
        this.addSql(`ALTER TABLE "user_settings" DROP COLUMN "language";`);
    }
}
