import { Migration } from '@mikro-orm/migrations';

export class Migration20260319205312 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "repair_payment" drop constraint "repair_payment_repair_request_id_foreign";`);

    this.addSql(`alter table "repair_payment" add constraint "repair_payment_repair_request_id_foreign" foreign key ("repair_request_id") references "repair_request" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "repair_payment" drop constraint "repair_payment_repair_request_id_foreign";`);

    this.addSql(`alter table "repair_payment" add constraint "repair_payment_repair_request_id_foreign" foreign key ("repair_request_id") references "repair_request" ("id") on update cascade;`);
  }

}
