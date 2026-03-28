import { Migration } from '@mikro-orm/migrations';

export class Migration20260328223546 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "article_view" ("id" varchar(255) not null, "article_id" varchar(255) not null, "user_id" varchar(255) null, "session_id" varchar(255) not null, "viewed_at" timestamptz not null, constraint "article_view_pkey" primary key ("id"));`);
    this.addSql(`create index "article_view_article_id_index" on "article_view" ("article_id");`);
    this.addSql(`create index "article_view_article_id_session_id_viewed_at_index" on "article_view" ("article_id", "session_id", "viewed_at");`);
    this.addSql(`create index "article_view_article_id_user_id_viewed_at_index" on "article_view" ("article_id", "user_id", "viewed_at");`);

    this.addSql(`alter table "article" add column "content" jsonb null, add column "view_count" int not null default 0;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "article_view" cascade;`);

    this.addSql(`alter table "article" drop column "content", drop column "view_count";`);
  }

}
