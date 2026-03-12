// src/modules/cursor/cursor.module.ts
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CursorGateway } from './cursor.gateway';
import { CursorService } from './cursor.service';
import { Cursor } from 'entities/cursor.entity';
import { redisProvider } from 'providers/redis.provider';

@Module({
  imports: [
    MikroOrmModule.forFeature([Cursor]),
  ],
  providers: [CursorGateway, CursorService, redisProvider],
  exports: [CursorService],
})
export class CursorModule { }
