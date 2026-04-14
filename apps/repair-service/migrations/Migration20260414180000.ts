import { Migration } from '@mikro-orm/migrations';

export class Migration20260414180000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "certificate" add column "pdf_document_id" varchar(255) null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "certificate" drop column "pdf_document_id";`);
  }

}
