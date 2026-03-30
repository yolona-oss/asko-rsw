import { Migration } from '@mikro-orm/migrations';

export class Migration20260331000000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "article" add column "description" varchar(500) null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "article" drop column "description";`);
  }

}
