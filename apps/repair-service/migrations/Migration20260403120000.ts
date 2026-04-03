import { Migration } from '@mikro-orm/migrations';

export class Migration20260403120000 extends Migration {

  override async up(): Promise<void> {
    // Prevent negative points balance at DB level
    this.addSql(`alter table "dealer_profile" add constraint "chk_points_balance_non_negative" check ("points_balance" >= 0);`);

    // Add pointsAwarded flag to certificate to prevent double-awarding
    this.addSql(`alter table "certificate" add column "points_awarded" boolean not null default false;`);
    // Mark existing paid certificates as already awarded
    this.addSql(`update "certificate" set "points_awarded" = true where "paid" = true and "dealer_id" is not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "certificate" drop column "points_awarded";`);
    this.addSql(`alter table "dealer_profile" drop constraint if exists "chk_points_balance_non_negative";`);
  }

}
