import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './task.service';
import { RepairClientModule } from 'modules/repair-client/repair-client.module';
import { ChatClientModule } from 'modules/chat-client/chat-client.module';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        RepairClientModule,
        ChatClientModule,
    ],
    providers: [
        TasksService
    ]
})
export class TaskScheduleModule { }
