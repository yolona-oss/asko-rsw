export * from './default-user-role'
export * from './refresh-token'
export * from './pagination'
export * from './password'
export * from './regex'

export const RESET_PASSWORD_TOKEN = {
  expiry: process.env.JWT_REFRESH_TOKEN_OPTION_EXPIRES_IN, // :-(
};

export const REQUSET_USER_KEY = 'user'
