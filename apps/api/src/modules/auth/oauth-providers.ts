import { AppConfig } from 'app.config';

export interface OAuthProviderConfig {
    clientId: string;
    clientSecret: string;
    authorizationURL: string;
    tokenURL: string;
    profileURL: string;
    scope: string;
    profileParser: (data: any, tokenResponse?: any) => {
        providerId: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        avatarUrl?: string;
    };
}

export function buildOAuthProviders(config: AppConfig): Record<string, OAuthProviderConfig> {
    const providers: Record<string, OAuthProviderConfig> = {};

    if (config.oauth.google.clientId) {
        providers.google = {
            clientId: config.oauth.google.clientId,
            clientSecret: config.oauth.google.clientSecret,
            authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenURL: 'https://oauth2.googleapis.com/token',
            profileURL: 'https://www.googleapis.com/oauth2/v2/userinfo',
            scope: 'profile email',
            profileParser: (data) => ({
                providerId: data.id,
                email: data.email,
                firstName: data.given_name,
                lastName: data.family_name,
                avatarUrl: data.picture,
            }),
        };
    }

    if (config.oauth.vk.clientId) {
        providers.vk = {
            clientId: config.oauth.vk.clientId,
            clientSecret: config.oauth.vk.clientSecret,
            authorizationURL: 'https://oauth.vk.com/authorize',
            tokenURL: 'https://oauth.vk.com/access_token',
            profileURL: 'https://api.vk.com/method/users.get?fields=photo_200&v=5.131',
            scope: 'email',
            profileParser: (data, tokenResponse) => {
                const user = data.response?.[0] ?? data;
                return {
                    providerId: String(tokenResponse?.user_id ?? user.id),
                    email: tokenResponse?.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    avatarUrl: user.photo_200,
                };
            },
        };
    }

    if (config.oauth.yandex.clientId) {
        providers.yandex = {
            clientId: config.oauth.yandex.clientId,
            clientSecret: config.oauth.yandex.clientSecret,
            authorizationURL: 'https://oauth.yandex.ru/authorize',
            tokenURL: 'https://oauth.yandex.ru/token',
            profileURL: 'https://login.yandex.ru/info?format=json',
            scope: 'login:email login:info login:avatar',
            profileParser: (data) => ({
                providerId: data.id,
                email: data.default_email,
                firstName: data.first_name,
                lastName: data.last_name,
                avatarUrl: data.default_avatar_id
                    ? `https://avatars.yandex.net/get-yapic/${data.default_avatar_id}/200x200`
                    : undefined,
            }),
        };
    }

    return providers;
}
