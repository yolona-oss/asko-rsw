import { Migration } from '@mikro-orm/migrations';

export class Migration20260328184756 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "address" add column "latitude" real null, add column "longitude" real null;`);

    this.addSql(`alter table "dealer_profile" add column "agreement_signature" text null, add column "agreement_signed_payload" text null;`);

    this.addSql(`alter table "user_device" add column "registration_signature" text null, add column "registration_signed_payload" text null;`);

    this.addSql(`alter table "certificate" add column "signature" text null, add column "signed_payload" text null;`);

    this.addSql(`alter table "repair_request" add column "completion_signature" text null, add column "completion_signed_payload" text null, add column "acceptance_signature" text null, add column "acceptance_signed_payload" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "address" drop column "latitude", drop column "longitude";`);

    this.addSql(`alter table "certificate" drop column "signature", drop column "signed_payload";`);

    this.addSql(`alter table "dealer_profile" drop column "agreement_signature", drop column "agreement_signed_payload";`);

    this.addSql(`alter table "repair_request" drop column "completion_signature", drop column "completion_signed_payload", drop column "acceptance_signature", drop column "acceptance_signed_payload";`);

    this.addSql(`alter table "user_device" drop column "registration_signature", drop column "registration_signed_payload";`);
  }

}
