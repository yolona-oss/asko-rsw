import { Migration } from '@mikro-orm/migrations';

export class Migration20260416100000 extends Migration {

  override isTransactional(): boolean {
    return false;
  }

  override async up(): Promise<void> {
    this.addSql(`alter type "message_type" add value if not exists 'document';`);
  }

  override async down(): Promise<void> {
    // Postgres does not support removing enum values without a full type rebuild.
  }

}
