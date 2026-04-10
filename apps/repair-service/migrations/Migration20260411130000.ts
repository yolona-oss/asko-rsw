import { Migration } from '@mikro-orm/migrations';

export class Migration20260411130000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "certificate" add column "expiry_reminder_sent" boolean not null default false;`);
    this.addSql(`alter table "certificate" add column "expiry_reminder_dismissed" boolean not null default false;`);
    this.addSql(`alter table "certificate" add column "replaced_certificate_id" varchar(255) null;`);
    this.addSql(`alter table "certificate" add constraint "certificate_replaced_certificate_id_foreign" foreign key ("replaced_certificate_id") references "certificate" ("id") on update cascade on delete set null;`);
    this.addSql(`create index "certificate_expires_at_status_index" on "certificate" ("expires_at", "status");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index "certificate_expires_at_status_index";`);
    this.addSql(`alter table "certificate" drop constraint "certificate_replaced_certificate_id_foreign";`);
    this.addSql(`alter table "certificate" drop column "replaced_certificate_id";`);
    this.addSql(`alter table "certificate" drop column "expiry_reminder_dismissed";`);
    this.addSql(`alter table "certificate" drop column "expiry_reminder_sent";`);
  }

}
