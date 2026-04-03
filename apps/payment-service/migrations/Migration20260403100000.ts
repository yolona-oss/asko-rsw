import { Migration } from '@mikro-orm/migrations';

export class Migration20260403100000 extends Migration {

  override async up(): Promise<void> {
    // Add partially_refunded status
    this.addSql(`alter type "payment_status" add value if not exists 'partially_refunded';`);

    // Payment table improvements
    this.addSql(`alter table "payment" alter column "amount" type numeric(12, 2) using "amount"::numeric(12, 2);`);
    this.addSql(`alter table "payment" add column "expires_at" timestamptz null;`);
    this.addSql(`create index "idx_payment_pending_expires" on "payment" ("status", "expires_at") where "status" = 'pending';`);
    this.addSql(`alter table "payment" add column "refunded_amount" numeric(12, 2) not null default 0;`);

    // Audit trail
    this.addSql(`create table "payment_audit" ("id" varchar(255) not null, "payment_id" varchar(255) not null, "from_status" varchar(50) null, "to_status" varchar(50) not null, "actor" varchar(255) not null, "reason" varchar(500) null, "metadata" jsonb null, "created_at" timestamptz not null, constraint "payment_audit_pkey" primary key ("id"));`);
    this.addSql(`create index "idx_payment_audit_payment_id" on "payment_audit" ("payment_id");`);

    // Failed event store
    this.addSql(`create table "failed_event" ("id" varchar(255) not null, "event_type" varchar(255) not null, "payload" jsonb not null, "target_queue" varchar(50) not null, "retry_count" int not null default 0, "last_error" text null, "next_retry_at" timestamptz not null, "created_at" timestamptz not null, constraint "failed_event_pkey" primary key ("id"));`);
    this.addSql(`create index "idx_failed_event_retry" on "failed_event" ("next_retry_at", "retry_count");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "failed_event" cascade;`);
    this.addSql(`drop table if exists "payment_audit" cascade;`);
    this.addSql(`alter table "payment" drop column "refunded_amount";`);
    this.addSql(`drop index if exists "idx_payment_pending_expires";`);
    this.addSql(`alter table "payment" drop column "expires_at";`);
    this.addSql(`alter table "payment" alter column "amount" type real using "amount"::real;`);
  }

}
