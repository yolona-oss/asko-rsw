import { Migration } from '@mikro-orm/migrations';

export class Migration20260415180000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter type "repair_request_status" add value if not exists 'en_route' after 'accepted';`);
  }

  override async down(): Promise<void> {
    // PostgreSQL does not support removing values from an enum type.
    // A full enum recreation would be needed, but since en_route rows may exist
    // the safest approach is to leave the value in place.
  }

}
