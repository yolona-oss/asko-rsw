import { Migration } from '@mikro-orm/migrations';

export class Migration20260414200000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "payment" add column "cash_confirm_code" varchar(10) null;`);
    this.addSql(`alter table "payment" add column "cash_confirm_attempts" int not null default 0;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "payment" drop column "cash_confirm_attempts";`);
    this.addSql(`alter table "payment" drop column "cash_confirm_code";`);
  }

}
