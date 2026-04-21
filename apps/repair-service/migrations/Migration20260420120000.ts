import { Migration } from '@mikro-orm/migrations';

export class Migration20260420120000 extends Migration {

  override async up(): Promise<void> {
    // New fields for refund lock
    this.addSql(`do $$ begin
      alter table "repair_request" add column "status_before_refund" varchar(255) null;
    exception when duplicate_column then null;
    end $$;`);

    // Certificate zero-cost tracking
    this.addSql(`do $$ begin
      alter table "repair_request" add column "certificate_covered_cost" boolean not null default false;
    exception when duplicate_column then null;
    end $$;`);

    this.addSql(`do $$ begin
      alter table "repair_request" add column "certificate_cost_overridden" boolean not null default false;
    exception when duplicate_column then null;
    end $$;`);

    // Backfill: paid → pending (remove PAID status)
    this.addSql(`update "repair_request" set "status" = 'pending' where "status" = 'paid';`);

    // Backfill: set certificate_covered_cost for existing cert-covered open requests
    this.addSql(`update "repair_request"
      set "certificate_covered_cost" = true, "total_cost" = 0
      where "certificate_id" is not null
        and "certificate_valid" = true
        and "status" not in ('completed', 'cancelled', 'refunded', 'refused')
        and "total_cost" is null;`);

    // Re-create paid_payment cache table if it was dropped
    this.addSql(`create table if not exists "paid_payment" (
      "payment_id" varchar(255) not null,
      "target_type" varchar(50) not null,
      "target_id" varchar(255) not null,
      "user_id" varchar(255) null,
      "amount" float8 null,
      "currency" varchar(10) null,
      "paid_at" timestamptz not null default now(),
      constraint "paid_payment_pkey" primary key ("payment_id")
    );`);
    this.addSql(`do $$ begin
      alter table "paid_payment" add constraint "paid_payment_target_type_id_unique" unique ("target_type", "target_id");
    exception when others then null;
    end $$;`);
    this.addSql(`create index if not exists "paid_payment_target_type_index" on "paid_payment" ("target_type");`);

    // Remove 'paid' from the native enum if it exists
    this.addSql(`do $$ begin
      alter type "repair_request_status" rename value 'paid' to '__paid_deprecated';
    exception when others then null;
    end $$;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "repair_request" drop column if exists "status_before_refund";`);
    this.addSql(`alter table "repair_request" drop column if exists "certificate_covered_cost";`);
    this.addSql(`alter table "repair_request" drop column if exists "certificate_cost_overridden";`);
  }

}
