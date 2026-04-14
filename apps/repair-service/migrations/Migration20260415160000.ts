import { Migration } from '@mikro-orm/migrations';

export class Migration20260415160000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "user_device" add column "validation_status" varchar(20) not null default 'pending';`);
    this.addSql(`alter table "user_device" add column "validation_error" text null;`);
    // Mark all existing devices as valid (they were registered before validation existed)
    this.addSql(`update "user_device" set "validation_status" = 'valid' where "validation_status" = 'pending';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user_device" drop column "validation_status";`);
    this.addSql(`alter table "user_device" drop column "validation_error";`);
  }

}
