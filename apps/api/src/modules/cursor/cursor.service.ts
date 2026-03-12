import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { Injectable, Inject } from '@nestjs/common';
import { Cursor } from 'entities/cursor.entity';
import Redis from 'ioredis';

@Injectable()
export class CursorService {
  private readonly CURSOR_PREFIX = 'cursor:';
  private readonly CURSOR_TTL = 5; // 5 seconds

  constructor(
    private readonly em: EntityManager,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) { }

  @CreateRequestContext()
  async updateCursor(
    sessionId: string,
    userId: string,
    username: string,
    x: number,
    y: number,
    cursorType?: string,
  ): Promise<Cursor> {
    const cursorKey = `${this.CURSOR_PREFIX}${sessionId}`;

    // Try to get from Redis first
    const cachedCursor = await this.redis.hgetall(cursorKey);

    let cursor: Cursor | null;

    if (Object.keys(cachedCursor).length > 0) {
      // Update existing cursor from cache
      cursor = new Cursor(sessionId, userId, username);
      cursor.x = x;
      cursor.y = y;
      cursor.color = cachedCursor.color;
      cursor.cursorType = cursorType || cachedCursor.cursorType;
      cursor.lastUpdate = new Date();
    } else {
      // Get from database or create new
      cursor = await this.em.findOne(Cursor, { sessionId });

      if (!cursor) {
        cursor = new Cursor(sessionId, userId, username);
        cursor.x = x;
        cursor.y = y;
        cursor.cursorType = cursorType;
        this.em.persist(cursor);
      } else {
        cursor.x = x;
        cursor.y = y;
        cursor.lastUpdate = new Date();
        if (cursorType) cursor.cursorType = cursorType;
      }
    }

    await this.em.flush();

    // Store in Redis for quick access
    await this.redis.hmset(cursorKey, {
      userId: cursor.userId,
      username: cursor.username,
      x: cursor.x,
      y: cursor.y,
      color: cursor.color,
      cursorType: cursor.cursorType || 'default',
      lastUpdate: cursor.lastUpdate.toISOString(),
    });

    // Set expiration
    await this.redis.expire(cursorKey, this.CURSOR_TTL);

    return cursor;
  }

  @CreateRequestContext()
  async removeCursor(sessionId: string): Promise<void> {
    const cursorKey = `${this.CURSOR_PREFIX}${sessionId}`;

    // Remove from Redis
    await this.redis.del(cursorKey);

    // Remove from database
    await this.em.nativeDelete(Cursor, { sessionId });
  }

  async getAllCursors(): Promise<any[]> {
    const keys = await this.redis.keys(`${this.CURSOR_PREFIX}*`);
    const cursors = [];

    for (const key of keys) {
      const cursorData = await this.redis.hgetall(key);
      if (cursorData && Object.keys(cursorData).length > 0) {
        cursors.push({
          sessionId: key.replace(this.CURSOR_PREFIX, ''),
          ...cursorData,
          x: parseFloat(cursorData.x),
          y: parseFloat(cursorData.y),
        });
      }
    }

    return cursors;
  }

  @CreateRequestContext()
  async cleanupStaleCursors(): Promise<void> {
    const staleThreshold = new Date(Date.now() - 5000); // 5 seconds ago

    const staleCursors = await this.em.find(Cursor, {
      lastUpdate: { $lt: staleThreshold },
    });

    for (const cursor of staleCursors) {
      await this.removeCursor(cursor.sessionId);
    }
  }

  async getActiveUsersCount(): Promise<number> {
    const keys = await this.redis.keys(`${this.CURSOR_PREFIX}*`);
    return keys.length;
  }
}
