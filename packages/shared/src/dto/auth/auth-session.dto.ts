import { IAuthUser } from './auth-user.dto';

/***
 * Data provided to authenticated users.
 */
export interface IAuthSession {
    user: IAuthUser;
    access_token: string;
}
