import { Migration } from '@mikro-orm/migrations';

export class Migration20260325130001 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "repair_request" add column "conversation_id" varchar(255) null;`);
    this.addSql(`alter table "repair_request" add column "chat_close_at" timestamptz null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "repair_request" drop column "conversation_id";`);
    this.addSql(`alter table "repair_request" drop column "chat_close_at";`);
  }

}
