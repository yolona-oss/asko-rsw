import { Migration } from '@mikro-orm/migrations';

export class Migration20260329220122 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "article_edge" ("id" varchar(255) not null, "source_id" varchar(255) not null, "target_id" varchar(255) not null, "weight" real not null default 0, "edge_type" text check ("edge_type" in ('tag', 'view', 'manual')) not null default 'tag', "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "article_edge_pkey" primary key ("id"));`);
    this.addSql(`create index "article_edge_source_id_index" on "article_edge" ("source_id");`);
    this.addSql(`create index "article_edge_target_id_index" on "article_edge" ("target_id");`);
    this.addSql(`alter table "article_edge" add constraint "article_edge_source_id_target_id_unique" unique ("source_id", "target_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "article_edge" cascade;`);
  }

}
