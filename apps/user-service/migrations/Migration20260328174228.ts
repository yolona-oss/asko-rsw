import { Migration } from '@mikro-orm/migrations';

export class Migration20260328174228 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "session" drop constraint if exists "session_type_check";`);

    this.addSql(`alter table "user" add column if not exists "middle_name" varchar(255) null;`);

    this.addSql(`alter table "session" add constraint "session_type_check" check("type" in ('ACCESS', 'REFRESH', 'RESET_PASSWORD', 'VERIFY_EMAIL', 'MFA_CHALLENGE'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "session" drop constraint if exists "session_type_check";`);

    this.addSql(`alter table "session" add constraint "session_type_check" check("type" in ('ACCESS', 'REFRESH', 'RESET_PASSWORD', 'VERIFY_EMAIL'));`);

    this.addSql(`alter table "user" drop column "middle_name";`);
  }

}
