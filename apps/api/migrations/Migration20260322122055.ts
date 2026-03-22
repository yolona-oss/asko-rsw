import { Migration } from '@mikro-orm/migrations';

export class Migration20260322122055 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter type "certificate_status" add value if not exists 'validation_error' after 'pending_payment';`);

    this.addSql(`alter table "certificate" alter column "status" type "certificate_status" using ("status"::"certificate_status");`);
    this.addSql(`alter table "certificate" alter column "status" set default 'pending_payment';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter type "certificate_status" add value if not exists 'pending_approval' after 'pending_payment';`);

    this.addSql(`alter table "certificate" alter column "status" type "certificate_status" using ("status"::"certificate_status");`);
    this.addSql(`alter table "certificate" alter column "status" set default 'pending_approval';`);
  }

}
