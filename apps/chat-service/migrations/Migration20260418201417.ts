import { Migration } from '@mikro-orm/migrations';

export class Migration20260418201417 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter type "user_activity" add value if not exists 'uploading_document' after 'uploading_video';`);
  }

}
