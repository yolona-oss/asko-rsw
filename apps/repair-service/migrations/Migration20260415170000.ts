import { Migration } from '@mikro-orm/migrations';

export class Migration20260415170000 extends Migration {

  override async up(): Promise<void> {
    // Convert statusTimestamps from object { status: timestamp } to array [{ status, timestamp }]
    // sorted by timestamp ascending
    this.addSql(`
      update "repair_request"
      set "status_timestamps" = coalesce(
        (
          select jsonb_agg(
            jsonb_build_object('status', kv.key, 'timestamp', kv.value #>> '{}')
            order by kv.value #>> '{}'
          )
          from jsonb_each("status_timestamps") as kv(key, value)
        ),
        '[]'::jsonb
      );
    `);

    // Change the default from '{}' to '[]'
    this.addSql(`alter table "repair_request" alter column "status_timestamps" set default '[]';`);
  }

  override async down(): Promise<void> {
    // Convert array back to object (last entry per status wins)
    this.addSql(`
      update "repair_request"
      set "status_timestamps" = coalesce(
        (
          select jsonb_object_agg(entry->>'status', entry->>'timestamp')
          from jsonb_array_elements("status_timestamps") as entry
        ),
        '{}'::jsonb
      );
    `);

    this.addSql(`alter table "repair_request" alter column "status_timestamps" set default '{}';`);
  }

}
