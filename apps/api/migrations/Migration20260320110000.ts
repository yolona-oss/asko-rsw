import { Migration } from '@mikro-orm/migrations';

export class Migration20260320110000 extends Migration {

  override async up(): Promise<void> {
    // Clean up orphaned PENDING payment rows where a PAID row already exists for the same target
    this.addSql(`update "repair_payment" set "status" = 'failed' where "status" = 'pending' and ("target_type", "target_id") in (select "target_type", "target_id" from "repair_payment" where "status" = 'paid');`);
  }

  override async down(): Promise<void> {
    // Cannot reliably revert — these rows were already orphaned duplicates
  }

}
