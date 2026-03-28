import { Migration } from '@mikro-orm/migrations';

export class Migration20260328203609 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "address" add column "validation_status" varchar(20) not null default 'pending', add column "validation_error" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "address" drop column "validation_status", drop column "validation_error";`);
  }

}
