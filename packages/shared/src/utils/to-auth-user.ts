import { IUser } from '../types/user/user.type';
import { IAuthUser } from '../dto/auth/auth-user.dto';

// const first_name_adjectives = [
//     'happy', 'sad', 'angry', 'cute', 'beautiful', 'pretty'
// ]
// const last_name_animals = [
//     'dog', 'cat', 'fox', 'wolf', 'lion', 'tiger', 'elephant', 'monkey', 'gorilla', 'zebra', 'panda', 'bear', 'koala'
// ]
// const createRandomName = () =>
//     `${first_name_adjectives[Math.floor(Math.random() * first_name_adjectives.length)]}_${last_name_animals[Math.floor(Math.random() * last_name_animals.length)]}`

export const toAuthUser = (user: IUser): IAuthUser => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    googleId: user.googleId,
    providers: user.providers,
    roles: user.roles,
});

