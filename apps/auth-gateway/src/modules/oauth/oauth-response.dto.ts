import { ApiProperty } from '@nestjs/swagger';
import { AuthProvider } from '@asko/shared';

export class OAuthLinkRecordDto {
    id: string;
    userId: string;
    @ApiProperty({ enum: AuthProvider, enumName: 'AuthProvider' })
    provider: AuthProvider;
    providerId: string;
    email: string;
    avatarUrl: string;
    createdAt: string;
}

export class OAuthLinksResponseDto {
    @ApiProperty({ type: [OAuthLinkRecordDto] })
    links: OAuthLinkRecordDto[];
}
