import { Migration } from '@mikro-orm/migrations';

export class Migration20260411035340 extends Migration {

  override async up(): Promise<void> {
    // 1. Create user_settings table
    this.addSql(`CREATE TABLE "user_settings" (
      "id" serial PRIMARY KEY,
      "user_id" varchar(255) NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
      "mfa_methods" text[] NOT NULL DEFAULT '{}',
      "chat_accept_conversations" boolean NOT NULL DEFAULT false,
      "chat_searchable" boolean NOT NULL DEFAULT false,
      "meta" jsonb NULL,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    );`);

    this.addSql(`CREATE INDEX "idx_user_settings_chat_searchable" ON "user_settings"("chat_searchable") WHERE chat_searchable = true;`);

    // 2. Backfill: one row per user, extracting known keys, archiving full blob to meta
    this.addSql(`
      INSERT INTO "user_settings" (user_id, mfa_methods, chat_accept_conversations, chat_searchable, meta)
      SELECT
        u.id,
        COALESCE(
          ARRAY(SELECT jsonb_array_elements_text(u.preferences -> 'mfa' -> 'methods')),
          '{}'::text[]
        ),
        COALESCE((u.preferences -> 'chat' ->> 'acceptConversations')::boolean, false),
        COALESCE((u.preferences -> 'chat' ->> 'searchable')::boolean, false),
        u.preferences
      FROM "user" u;
    `);

    // 3. Add settings_id FK column on user, backfill, enforce NOT NULL
    this.addSql(`ALTER TABLE "user" ADD COLUMN "settings_id" int NULL REFERENCES "user_settings"(id) ON DELETE SET NULL;`);
    this.addSql(`UPDATE "user" u SET settings_id = s.id FROM "user_settings" s WHERE s.user_id = u.id;`);
    this.addSql(`ALTER TABLE "user" ALTER COLUMN "settings_id" SET NOT NULL;`);
    this.addSql(`CREATE UNIQUE INDEX "idx_user_settings_id" ON "user"("settings_id");`);

    // 4. Drop the old preferences column
    this.addSql(`ALTER TABLE "user" DROP COLUMN "preferences";`);
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "user" ADD COLUMN "preferences" jsonb NULL;`);

    // Reconstruct preferences from archived meta if present; else rebuild from structured columns
    this.addSql(`
      UPDATE "user" u SET preferences = COALESCE(
        s.meta,
        jsonb_strip_nulls(jsonb_build_object(
          'mfa',  CASE WHEN array_length(s.mfa_methods, 1) > 0
                       THEN jsonb_build_object('methods', to_jsonb(s.mfa_methods))
                       ELSE NULL END,
          'chat', jsonb_build_object(
            'acceptConversations', s.chat_accept_conversations,
            'searchable',          s.chat_searchable
          )
        ))
      )
      FROM "user_settings" s WHERE u.settings_id = s.id;
    `);

    this.addSql(`DROP INDEX IF EXISTS "idx_user_settings_id";`);
    this.addSql(`ALTER TABLE "user" DROP COLUMN "settings_id";`);
    this.addSql(`DROP INDEX IF EXISTS "idx_user_settings_chat_searchable";`);
    this.addSql(`DROP TABLE "user_settings";`);
  }

}
