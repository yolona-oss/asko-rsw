import { Migration } from '@mikro-orm/migrations';

export class Migration20260411170000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "wschedule_pattern" add column "status" text check ("status" in ('pending', 'approved', 'rejected')) not null default 'pending';`);
    this.addSql(`alter table "wschedule_pattern" add column "approved_by" varchar(255) null;`);
    this.addSql(`alter table "wschedule_pattern" add column "approved_at" timestamptz null;`);
    this.addSql(`alter table "wschedule_pattern" add column "pending_data" jsonb null;`);
    // Existing rows are already live — mark them approved so the resolver keeps serving them.
    this.addSql(`update "wschedule_pattern" set "status" = 'approved', "approved_at" = "updated_at" where "status" = 'pending';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "wschedule_pattern" drop column "pending_data";`);
    this.addSql(`alter table "wschedule_pattern" drop column "approved_at";`);
    this.addSql(`alter table "wschedule_pattern" drop column "approved_by";`);
    this.addSql(`alter table "wschedule_pattern" drop column "status";`);
  }

}
