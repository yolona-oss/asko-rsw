import { Migration } from '@mikro-orm/migrations';

export class Migration20260228180435 extends Migration {

  override async up(): Promise<void> {
    // Schema already applied by Migration20260227151614
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user_address" drop constraint if exists "user_address_address_id_foreign";`);
    this.addSql(`alter table "city_distances" drop constraint if exists "city_distances_from_city_id_foreign";`);
    this.addSql(`alter table "city_distances" drop constraint if exists "city_distances_to_city_id_foreign";`);
    this.addSql(`alter table "session" drop constraint if exists "session_user_id_foreign";`);
    this.addSql(`alter table "user_address" drop constraint if exists "user_address_user_id_foreign";`);
    this.addSql(`alter table "employee" drop constraint if exists "employee_user_id_foreign";`);
    this.addSql(`alter table "employee" drop constraint if exists "employee_schedule_id_foreign";`);

    this.addSql(`drop table if exists "address" cascade;`);
    this.addSql(`drop table if exists "cities" cascade;`);
    this.addSql(`drop table if exists "city_distances" cascade;`);
    this.addSql(`drop table if exists "fuel_surcharges" cascade;`);
    this.addSql(`drop table if exists "image" cascade;`);
    this.addSql(`drop table if exists "pallet_coefficients" cascade;`);
    this.addSql(`drop table if exists "payment" cascade;`);
    this.addSql(`drop table if exists "tariffs" cascade;`);
    this.addSql(`drop table if exists "user" cascade;`);
    this.addSql(`drop table if exists "session" cascade;`);
    this.addSql(`drop table if exists "user_address" cascade;`);
    this.addSql(`drop table if exists "weight_coefficients" cascade;`);
    this.addSql(`drop table if exists "wschedule" cascade;`);
    this.addSql(`drop table if exists "employee" cascade;`);
    this.addSql(`drop type if exists "role";`);
  }

}
