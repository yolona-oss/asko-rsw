import { Migration } from '@mikro-orm/migrations';

export class Migration20260419120001 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`
      update "notification" set "urgency" = case
        when "type" in ('payment_failed', 'certificate_integrity_failed', 'repair_schedule_auto_paused')
          then 'critical'
        when "type" in (
          'invoice_unpaid_reminder', 'repair_assignment_reminder', 'repair_in_progress_stuck',
          'certificate_expiring_soon', 'certificate_expired', 'avr_signing_requested',
          'repair_schedule_ending', 'repair_diagnostics_declined', 'address_validation_failed',
          'user_device_validation_failed', 'schedule_rejected', 'schedule_pattern_rejected',
          'schedule_extra_day_requested', 'schedule_extra_day_rejected',
          'schedule_deleted', 'schedule_pattern_deleted'
        ) then 'high'
        when "type" in (
          'chat_participant_added', 'chat_participant_removed', 'address_validated',
          'user_device_validated', 'repair_part_shipped', 'avr_signed'
        ) then 'low'
        else 'normal'
      end
      where "urgency" = 'normal'
        and "type" in (
          'payment_failed', 'certificate_integrity_failed', 'repair_schedule_auto_paused',
          'invoice_unpaid_reminder', 'repair_assignment_reminder', 'repair_in_progress_stuck',
          'certificate_expiring_soon', 'certificate_expired', 'avr_signing_requested',
          'repair_schedule_ending', 'repair_diagnostics_declined', 'address_validation_failed',
          'user_device_validation_failed', 'schedule_rejected', 'schedule_pattern_rejected',
          'schedule_extra_day_requested', 'schedule_extra_day_rejected',
          'schedule_deleted', 'schedule_pattern_deleted',
          'chat_participant_added', 'chat_participant_removed', 'address_validated',
          'user_device_validated', 'repair_part_shipped', 'avr_signed'
        );
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`update "notification" set "urgency" = 'normal';`);
  }

}
