import { Migration } from '@mikro-orm/migrations';

export class Migration20260418201349 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "user" drop constraint "user_settings_id_fkey";`);

    this.addSql(`alter table "user_oauth_link" alter column "created_at" drop default;`);
    this.addSql(`alter table "user_oauth_link" alter column "created_at" type timestamptz using ("created_at"::timestamptz);`);

    this.addSql(`drop index "idx_user_settings_chat_searchable";`);

    this.addSql(`alter table "user_settings" add column "language" varchar(5) not null default 'ru';`);
    this.addSql(`alter table "user_settings" alter column "created_at" drop default;`);
    this.addSql(`alter table "user_settings" alter column "created_at" type timestamptz using ("created_at"::timestamptz);`);
    this.addSql(`alter table "user_settings" alter column "updated_at" drop default;`);
    this.addSql(`alter table "user_settings" alter column "updated_at" type timestamptz using ("updated_at"::timestamptz);`);

    this.addSql(`alter table "user" add constraint "user_settings_id_foreign" foreign key ("settings_id") references "user_settings" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "user" drop constraint "idx_user_settings_id";`);
    this.addSql(`alter table "user" add constraint "user_settings_id_unique" unique ("settings_id");`);

    this.addSql(`drop index "idx_session_rotated_at";`);

    this.addSql(`drop index "idx_user_status_user_changed";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user" drop constraint "user_settings_id_foreign";`);

    this.addSql(`CREATE INDEX idx_session_rotated_at ON public.session USING btree (rotated_at) WHERE (rotated_at IS NOT NULL);`);

    this.addSql(`alter table "user" add constraint "user_settings_id_fkey" foreign key ("settings_id") references "user_settings" ("id") on update no action on delete set null;`);
    this.addSql(`drop index "user_settings_id_unique";`);
    this.addSql(`alter table "user" add constraint "idx_user_settings_id" unique ("settings_id");`);

    this.addSql(`alter table "user_oauth_link" alter column "created_at" type timestamptz(6) using ("created_at"::timestamptz(6));`);
    this.addSql(`alter table "user_oauth_link" alter column "created_at" set default now();`);

    this.addSql(`alter table "user_settings" drop column "language";`);

    this.addSql(`alter table "user_settings" alter column "created_at" type timestamptz(6) using ("created_at"::timestamptz(6));`);
    this.addSql(`alter table "user_settings" alter column "created_at" set default now();`);
    this.addSql(`alter table "user_settings" alter column "updated_at" type timestamptz(6) using ("updated_at"::timestamptz(6));`);
    this.addSql(`alter table "user_settings" alter column "updated_at" set default now();`);
    this.addSql(`CREATE INDEX idx_user_settings_chat_searchable ON public.user_settings USING btree (chat_searchable) WHERE (chat_searchable = true);`);

    this.addSql(`create index "idx_user_status_user_changed" on "user_status_history" ("user_id", "changed_at");`);
  }

}
