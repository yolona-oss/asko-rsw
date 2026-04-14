import { Migration } from '@mikro-orm/migrations';

export class Migration20260414200000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "repair_request" add column "status_timestamps" jsonb not null default '{}';`);

    // Backfill: pending timestamp from created_at, current status timestamp from updated_at
    this.addSql(`
      update "repair_request"
      set "status_timestamps" = case
        when "status" = 'pending' then
          jsonb_build_object('pending', to_char("created_at" at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
        else
          jsonb_build_object(
            'pending', to_char("created_at" at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
            "status", to_char("updated_at" at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
          )
      end;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "repair_request" drop column "status_timestamps";`);
  }

}
