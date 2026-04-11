import { Migration } from '@mikro-orm/migrations';

export class Migration20260411180000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "repair_request" add column "certificate_snapshot" jsonb null;`);

    // Best-effort backfill: for already-completed requests with a linked, applied
    // certificate, freeze the cert's current state so historical display works.
    this.addSql(`
      update "repair_request" rr
      set "certificate_snapshot" = jsonb_build_object(
        'id', c."id",
        'certificateNumber', c."certificate_number",
        'status', c."status",
        'issuedAt', to_char(c."issued_at" at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'expiresAt', to_char(c."expires_at" at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'frozenAt', to_char(coalesce(rr."updated_at", now()) at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'signedPayload', c."signed_payload",
        'signature', c."signature"
      )
      from "certificate" c
      where rr."certificate_id" = c."id"
        and rr."certificate_valid" = true
        and rr."status" = 'completed'
        and rr."certificate_snapshot" is null;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "repair_request" drop column "certificate_snapshot";`);
  }

}
