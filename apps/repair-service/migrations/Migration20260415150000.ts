import { Migration } from '@mikro-orm/migrations';

export class Migration20260415150000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "broken_part" add column "is_suggestion" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "broken_part" drop column "is_suggestion";`);
  }

}
