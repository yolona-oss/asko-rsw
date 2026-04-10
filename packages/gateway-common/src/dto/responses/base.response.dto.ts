import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
    @ApiProperty()
    message!: string;
}

export class DeleteCountResponseDto {
    @ApiProperty()
    message!: string;

    @ApiProperty()
    count!: number;
}

export class EmptyResponseDto {}
