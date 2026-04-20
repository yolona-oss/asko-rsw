import { Migration } from '@mikro-orm/migrations';

export class Migration20260420120000 extends Migration {

  override async up(): Promise<void> {
    // Partial index for cleanup of read notifications (WHERE is_read = true AND read_at < ?)
    this.addSql(`create index "idx_notification_read_cleanup" on "notification" ("read_at") where is_read = true;`);

    // Partial index for cleanup of unread notifications by age/urgency
    this.addSql(`create index "idx_notification_unread_cleanup" on "notification" ("created_at", "urgency") where is_read = false;`);

    // Composite index for group filter queries (WHERE user_id = ? AND type IN (...))
    this.addSql(`create index "idx_notification_user_type" on "notification" ("user_id", "type");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index "idx_notification_read_cleanup";`);
    this.addSql(`drop index "idx_notification_unread_cleanup";`);
    this.addSql(`drop index "idx_notification_user_type";`);
  }

}
