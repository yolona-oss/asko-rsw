import { Migration } from '@mikro-orm/migrations';

export class Migration20260412212555 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`drop index "idx_user_status_user_changed";`);

    this.addSql(`drop index "idx_wschedule_user_status_dates";`);
    this.addSql(`drop index "idx_wschedule_user_type_dates";`);

    this.addSql(`drop index "idx_pattern_history_user_changed";`);
    this.addSql(`drop index "idx_pattern_history_user_effective";`);
  }

  override async down(): Promise<void> {
    this.addSql(`create index "idx_user_status_user_changed" on "user_status_history" ("user_id", "changed_at");`);

    this.addSql(`create index "idx_wschedule_user_status_dates" on "wschedule" ("user_id", "status", "date_from", "date_to");`);
    this.addSql(`create index "idx_wschedule_user_type_dates" on "wschedule" ("user_id", "type", "date_from", "date_to");`);

    this.addSql(`create index "idx_pattern_history_user_changed" on "wschedule_pattern_history" ("user_id", "changed_at");`);
    this.addSql(`create index "idx_pattern_history_user_effective" on "wschedule_pattern_history" ("user_id", "effective_from");`);
  }

}
