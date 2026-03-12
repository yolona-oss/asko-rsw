import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './task.service';
import { CursorModule } from 'modules/cursor/cursor.module';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        CursorModule
    ],
    providers: [
        TasksService
    ]
})
export class TaskScheduleModule { }
