import { Migration } from '@mikro-orm/migrations';

export class Migration20260414214959 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "session" add column "rotated_at" timestamptz null;`);
    this.addSql(`create index "idx_session_rotated_at" on "session" ("rotated_at") where "rotated_at" is not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index "idx_session_rotated_at";`);
    this.addSql(`alter table "session" drop column "rotated_at";`);
  }

}
