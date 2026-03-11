/***
 * Cookie setting for refresh token
 */
export const REFRESH_TOKEN = {
    //secret: process.env.AUTH_REFRESH_TOKEN_SECRET,
    cookie: {
        name: "refreshTkn",
        options: {
            sameSite: false,
            secure: true,
            httpOnly: false,
            expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
        },
    },
};

/***
 * Cookie setting for reset password
 */
export const RESET_PASSWORD_TOKEN = {
    expiry: 5 * 60 * 1000, // 5 minutes
};

/***
 * The key used to access the user from the request
 */
export const REQUSET_USER_KEY = 'user'
