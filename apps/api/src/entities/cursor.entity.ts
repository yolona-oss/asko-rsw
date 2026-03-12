import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/core';

@Entity()
@Unique({ properties: ['sessionId'] })
export class Cursor {
  @PrimaryKey()
  id!: number;

  @Property()
  sessionId!: string;

  @Property()
  userId!: string;

  @Property()
  username!: string;

  @Property()
  x!: number;

  @Property()
  y!: number;

  @Property()
  color!: string;

  @Property()
  lastUpdate!: Date;

  @Property({ nullable: true })
  cursorType?: string;

  constructor(sessionId: string, userId: string, username: string) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.username = username;
    this.x = 0;
    this.y = 0;
    this.color = this.generateRandomColor();
    this.lastUpdate = new Date();
  }

  private generateRandomColor(): string {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 60%)`;
  }
}
