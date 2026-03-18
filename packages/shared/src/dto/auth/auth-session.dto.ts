import { IAuthUser } from './auth-user.dto';

/***
 * Data provided to authenticated users.
 */
export interface IAuthSession {
    user: IAuthUser;
    access_token: string;
    /** Included only in non-production for dev account switcher */
    refresh_token?: string;
}
