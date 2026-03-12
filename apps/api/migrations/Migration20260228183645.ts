import { Migration } from '@mikro-orm/migrations';

export class Migration20260228183645 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`select 1`);
  }

  override async down(): Promise<void> {
    this.addSql(`select 1`);
  }

}
