export class CreateWScheduleDto {
    date!: string; // e.g. "2025-11-08"
    startTime!: string; // e.g. "20:25"
    endTime!: string; // e.g. "22:00"
    repeatRule?: string
}
