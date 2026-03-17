import { Migration } from '@mikro-orm/migrations';

export class Migration20260317142125 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "repairer" drop column "rating";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "repairer" add column "rating" float4 not null default 0;`);
  }

}
