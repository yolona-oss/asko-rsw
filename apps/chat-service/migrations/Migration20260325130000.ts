import { Migration } from '@mikro-orm/migrations';

export class Migration20260325130000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "conversation" add column "closed_at" timestamptz null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "conversation" drop column "closed_at";`);
  }

}
