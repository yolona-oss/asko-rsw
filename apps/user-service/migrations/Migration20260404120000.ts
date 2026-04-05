import { Migration } from '@mikro-orm/migrations';

export class Migration20260404120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`CREATE TABLE IF NOT EXISTS "user_oauth_link" (
      "id" uuid NOT NULL,
      "user_id" varchar(255) NOT NULL,
      "provider" varchar(50) NOT NULL,
      "provider_id" varchar(255) NOT NULL,
      "email" varchar(255) NULL,
      "avatar_url" varchar(500) NULL,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "user_oauth_link_pkey" PRIMARY KEY ("id")
    );`);

    this.addSql(`CREATE INDEX IF NOT EXISTS "user_oauth_link_user_id_index" ON "user_oauth_link" ("user_id");`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "user_oauth_link_provider_provider_id_unique" ON "user_oauth_link" ("provider", "provider_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "user_oauth_link";`);
  }

}
