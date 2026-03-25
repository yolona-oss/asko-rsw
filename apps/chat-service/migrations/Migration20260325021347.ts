import { Migration } from '@mikro-orm/migrations';

export class Migration20260325021347 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create type "conversation_type" as enum ('direct', 'group');`);
    this.addSql(`create type "participant_role" as enum ('owner', 'admin', 'member');`);
    this.addSql(`create type "message_type" as enum ('text', 'image', 'video', 'system');`);
    this.addSql(`create type "presence_status" as enum ('online', 'offline');`);
    this.addSql(`create type "user_activity" as enum ('idle', 'typing', 'uploading_image', 'uploading_video');`);
    this.addSql(`create table "conversation" ("id" varchar(255) not null, "type" "conversation_type" not null, "name" varchar(255) null, "creator_id" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "conversation_pkey" primary key ("id"));`);
    this.addSql(`create index "conversation_creator_id_index" on "conversation" ("creator_id");`);

    this.addSql(`create table "conversation_participant" ("id" varchar(255) not null, "user_id" varchar(255) not null, "conversation_id" varchar(255) not null, "role" "participant_role" not null default 'member', "last_read_message_id" varchar(255) null, "joined_at" timestamptz not null, constraint "conversation_participant_pkey" primary key ("id"));`);
    this.addSql(`create index "conversation_participant_user_id_index" on "conversation_participant" ("user_id");`);

    this.addSql(`create table "message" ("id" varchar(255) not null, "conversation_id" varchar(255) not null, "sender_id" varchar(255) not null, "type" "message_type" not null, "text" text null, "attachment_json" jsonb null, "is_edited" boolean not null default false, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "message_pkey" primary key ("id"));`);
    this.addSql(`create index "message_sender_id_index" on "message" ("sender_id");`);

    this.addSql(`create table "user_presence" ("user_id" varchar(255) not null, "status" "presence_status" not null default 'offline', "activity" "user_activity" not null default 'idle', "conversation_id" varchar(255) null, "last_seen_at" timestamptz not null, constraint "user_presence_pkey" primary key ("user_id"));`);
    this.addSql(`create index "user_presence_user_id_index" on "user_presence" ("user_id");`);

    this.addSql(`alter table "conversation_participant" add constraint "conversation_participant_conversation_id_foreign" foreign key ("conversation_id") references "conversation" ("id") on update cascade;`);

    this.addSql(`alter table "message" add constraint "message_conversation_id_foreign" foreign key ("conversation_id") references "conversation" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "conversation_participant" drop constraint "conversation_participant_conversation_id_foreign";`);

    this.addSql(`alter table "message" drop constraint "message_conversation_id_foreign";`);

    this.addSql(`drop table if exists "conversation" cascade;`);

    this.addSql(`drop table if exists "conversation_participant" cascade;`);

    this.addSql(`drop table if exists "message" cascade;`);

    this.addSql(`drop table if exists "user_presence" cascade;`);

    this.addSql(`drop type "conversation_type";`);
    this.addSql(`drop type "participant_role";`);
    this.addSql(`drop type "message_type";`);
    this.addSql(`drop type "presence_status";`);
    this.addSql(`drop type "user_activity";`);
  }

}
