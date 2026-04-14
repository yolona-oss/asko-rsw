/***
 * Cookie setting for refresh token
 */
export const REFRESH_TOKEN = {
    cookie: {
        name: "refreshTkn",
        options: {
            sameSite: 'lax' as const,
            secure: true,
            httpOnly: true,
            path: '/',
            maxAge: 5 * 24 * 60 * 60 * 1000, // 5 days
        },
    },
};

/***
 * The key used to access the user from the request
 */
export const REQUEST_USER_KEY = 'user'
