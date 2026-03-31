import { Migration } from '@mikro-orm/migrations';

export class Migration20260401000000 extends Migration {
  override async up(): Promise<void> {
    // 1. Create article_tag junction table
    this.addSql(`
      CREATE TABLE "article_tag" (
        "id" varchar(255) NOT NULL,
        "article_id" varchar(255) NOT NULL,
        "tag" varchar(255) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "article_tag_pkey" PRIMARY KEY ("id")
      );
    `);
    this.addSql(`CREATE INDEX "article_tag_article_id_index" ON "article_tag" ("article_id");`);
    this.addSql(`CREATE INDEX "article_tag_tag_index" ON "article_tag" ("tag");`);
    this.addSql(`ALTER TABLE "article_tag" ADD CONSTRAINT "article_tag_article_id_tag_unique" UNIQUE ("article_id", "tag");`);

    // 2. Migrate existing JSON tags into junction table
    this.addSql(`
      INSERT INTO "article_tag" ("id", "article_id", "tag", "created_at")
      SELECT
        gen_random_uuid()::varchar,
        a.id,
        LOWER(TRIM(t.tag)),
        a.created_at
      FROM "article" a,
           LATERAL jsonb_array_elements_text(COALESCE(a.tags::jsonb, '[]'::jsonb)) AS t(tag)
      WHERE TRIM(t.tag) != ''
      ON CONFLICT DO NOTHING;
    `);

    // 3. Drop the old JSON column
    this.addSql(`ALTER TABLE "article" DROP COLUMN IF EXISTS "tags";`);
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "article" ADD COLUMN "tags" json NULL;`);

    this.addSql(`
      UPDATE "article" a
      SET tags = sub.tags_json::json
      FROM (
        SELECT article_id, jsonb_agg(tag) AS tags_json
        FROM "article_tag"
        GROUP BY article_id
      ) sub
      WHERE a.id = sub.article_id;
    `);

    this.addSql(`DROP TABLE IF EXISTS "article_tag" CASCADE;`);
  }
}
