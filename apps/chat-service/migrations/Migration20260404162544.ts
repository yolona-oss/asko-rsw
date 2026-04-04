import { Migration } from '@mikro-orm/migrations';

export class Migration20260404162544 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create type "message_status" as enum ('sending', 'delivered', 'seen');`);
    this.addSql(`alter table "conversation" add column "avatar_url" varchar(500) null;`);

    this.addSql(`alter table "message" add column "status" "message_status" not null default 'delivered', add column "delivered_at" timestamptz null, add column "read_at" timestamptz null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "conversation" drop column "avatar_url";`);

    this.addSql(`alter table "message" drop column "status", drop column "delivered_at", drop column "read_at";`);

    this.addSql(`drop type "message_status";`);
  }

}
