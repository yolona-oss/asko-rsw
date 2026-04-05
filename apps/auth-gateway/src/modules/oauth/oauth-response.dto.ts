export class OAuthLinkRecordDto {
    id: string;
    userId: string;
    provider: string;
    providerId: string;
    email: string;
    avatarUrl: string;
    createdAt: string;
}

export class OAuthLinksResponseDto {
    links: OAuthLinkRecordDto[];
}
