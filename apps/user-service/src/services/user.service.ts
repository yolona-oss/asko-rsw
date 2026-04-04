import { Injectable } from '@nestjs/common';
import { User, UserPopulateHints } from 'entities/auth/user.entity';

import { AppErrors } from 'common/error';
import { DeepPartial } from 'types/deep-partial.type';
import CryptoService from './crypto.service'

import {
    CreateUserDto,
    UpdateUserDto,
    Role,
    MIN_USER_PASSWORD_LENGTH,
    MAX_USER_PASSWORD_LENGTH,
    MIN_USER_PASSWORD_ENTROPY,
    PaginationDto,
    PaginatedResponseDto,
    TokenType,
    DEFAULT_USER_ROLE,
    AuthProvider,
} from '@asko/shared';

import { Writeable } from 'types/writable.type';
import { EntityManager } from '@mikro-orm/postgresql';
import { CreateRequestContext, Populate } from '@mikro-orm/core';

import { Session, UserAddress } from 'entities';

const USER_SORTABLE_FIELDS = ['createdAt', 'firstName', 'lastName', 'email', 'phone', 'isActive'] as const;

@Injectable()
export class UserService {
    constructor(
        private readonly em: EntityManager,
    ) { }

    @CreateRequestContext()
    async findAll(dto: PaginationDto & { search?: string; role?: string; status?: string; sortBy?: string; sortOrder?: string },
        relations?: Populate<User, "sessions" | "addresses" | "roles">
    ): Promise<PaginatedResponseDto<User>> {
        const offset = dto.page ?? 0
        const limit = dto.limit ?? 10

        const where: Record<string, any> = {};
        if (dto.search) {
            where.$or = [
                { firstName: { $ilike: `%${dto.search}%` } },
                { lastName: { $ilike: `%${dto.search}%` } },
                { email: { $ilike: `%${dto.search}%` } },
                { phone: { $ilike: `%${dto.search}%` } },
            ];
        }
        if (dto.role) {
            where.roles = { $contains: [dto.role] };
        }
        if (dto.status === 'active') {
            where.isActive = true;
        } else if (dto.status === 'disabled') {
            where.isActive = false;
        }

        const orderBy: Record<string, 'ASC' | 'DESC'> = dto.sortBy && (USER_SORTABLE_FIELDS as readonly string[]).includes(dto.sortBy)
            ? { [dto.sortBy]: dto.sortOrder === 'asc' ? 'ASC' : 'DESC' }
            : { createdAt: 'DESC' };

        const [entities, overallCount] = await this.em.findAndCount(User, where, {
            offset,
            limit,
            orderBy,
            populate: relations,
        })

        return {
            data: entities,
            overallCount,
            pagination: {
                page: offset,
                limit
            }
        }
    }

    @CreateRequestContext()
    async findById(id: string, relations?: Populate<User, UserPopulateHints>): Promise<User | null> {
        return await this.em.findOne(User, { id }, { populate: relations })
    }

    @CreateRequestContext()
    async findByPhone(phone: string,
        relations?: Populate<User, UserPopulateHints>
    ): Promise<User | null> {
        return await this.em.findOne(User, { phone }, { populate: relations })
    }

    @CreateRequestContext()
    async findByEmail(email: string, relations?: Populate<User, UserPopulateHints>): Promise<User | null> {
        return await this.em.findOne(User, { email }, { populate: relations })
    }

    @CreateRequestContext()
    async findByAssignedToken(tokenHash: string, relations?: Populate<User, UserPopulateHints>): Promise<User | null> {
        const session = await this.em.findOne(Session, { token: tokenHash })
        if (!session) {
            return null
        }
        return await this.findById(session.user.id, relations)
    }

    @CreateRequestContext()
    async addToken(
        userId: string,
        token: string,
        options: {
            type: TokenType,
            deviceInfo: string,
            ipAddress: string,
            expiresAt: Date
        }
    ): Promise<User> {
        const user = await this.findById(userId)
        if (!user) {
            throw AppErrors.dbEntityNotFound('User not found')
        }

        {
            const session = await this.em.findOne(Session, { token })
            if (session) {
                throw AppErrors.invalidData('Session already exists')
            }
        }

        const session = this.em.create(Session, {
            token,
            user,
            ...options,
            createdAt: new Date(),
        })

        user.sessions.add(session)

        await this.em.persistAndFlush(user)

        return user
    }

    @CreateRequestContext()
    async removeToken(token: string) {
        const session = await this.em.findOne(Session, { token })
        if (!session) {
            throw AppErrors.dbEntityNotFound('Session not found')
        }

        await this.em.removeAndFlush(session)
    }

    @CreateRequestContext()
    async dropTokens(userId: string) {
        const user = await this.findById(userId)
        if (!user) {
            throw AppErrors.dbEntityNotFound('User not found')
        }
        user.sessions.removeAll()
        await this.em.persistAndFlush(user)
    }

    async create(userData: CreateUserDto): Promise<User> {
        return await this.create_roleWrap(userData, userData.roles ?? [DEFAULT_USER_ROLE])
    }

    @CreateRequestContext()
    async create_roleWrap(userData: CreateUserDto, provideRoles: Role[] = [DEFAULT_USER_ROLE]) {
        const isEmailDuplicate = userData.email ? Boolean(await this.findByEmail(userData.email)) : false
        const isPhoneDuplicate = userData.phone ? Boolean(await this.findByPhone(userData.phone)) : false
        if (isEmailDuplicate || isPhoneDuplicate) {
            throw AppErrors.dbEntityExists('User already exists')
        }

        if (userData.email && !Boolean(userData.password)) {
            throw AppErrors.invalidData('Password is required')
        }

        if (!userData.email && !userData.phone) {
            throw AppErrors.invalidData('Email or phone is required')
        }

        const provider = userData.email ? AuthProvider.EMAIL : AuthProvider.PHONE

        let passwordHash: string | undefined;
        if (userData.password) {
            this.checkPasswordStrength(userData.password);
            passwordHash = await CryptoService.createPasswordHash(userData.password);
        }

        const user = this.em.create(User, {
            firstName: userData.firstName,
            lastName: userData.lastName,
            middleName: userData.middleName,
            email: userData.email?.toLowerCase(),
            phone: userData.phone,
            passwordHash,
            emailVerified: false,
            phoneVerified: false,
            sessions: [],
            roles: provideRoles,
            providers: [provider],

            addresses: [],

            createdAt: new Date(),
            updatedAt: new Date(),
        })

        await this.em.persistAndFlush(user)

        return user
    }

    @CreateRequestContext()
    async remove(id: string) {
        const user = await this.findById(id)
        if (!user) {
            throw AppErrors.dbEntityNotFound('User not found')
        }
        await this.em.removeAndFlush(user)
    }

    @CreateRequestContext()
    async updateSafe(id: string, _newUserInfo: DeepPartial<UpdateUserDto>, currentPassword?: string): Promise<User> {
        const user = await this.findById(id)
        if (!user) {
            throw AppErrors.dbEntityNotFound('User not found')
        }

        let newUserInfo: DeepPartial<Writeable<UpdateUserDto>> = _newUserInfo
        if (Object.keys(newUserInfo).length == 0) {
            throw AppErrors.invalidData('Nothing to update')
        }

        if (newUserInfo.password) {
            if (newUserInfo.email && !user.email && !user.passwordHash) {
                user.passwordHash = await CryptoService.createPasswordHash(newUserInfo.password)
            } else if (currentPassword && user.passwordHash) {
                if (!user.email) {
                    throw AppErrors.internalError('User has no email but have password.\nP.S sorry')
                }
                if (!(await CryptoService.comparePasswords(currentPassword, user.passwordHash))) {
                    throw AppErrors.invalidData('Invalid credentials')
                }
                user.passwordHash = await CryptoService.createPasswordHash(newUserInfo.password)
            } else {
                throw AppErrors.badRequest('Password is required')
            }
        }

        if (newUserInfo.name) {
            const parts = newUserInfo.name.split(' ')
            user.lastName = parts[0]
            user.firstName = parts[1]
            user.middleName = parts[2]
        }
        if (newUserInfo.middleName !== undefined) {
            user.middleName = newUserInfo.middleName || undefined
        }

        if (newUserInfo.phone) {
            if (user.phone !== newUserInfo.phone) {
                // If current phone is verified, skip — phone change requires confirmation flow
                if (!user.phoneVerified) {
                    user.phone = newUserInfo.phone
                    user.phoneVerified = false
                }
            }
        }

        if (newUserInfo.email) {
            if (user.email !== newUserInfo.email.toLowerCase()) {
                // If current email is verified, skip — email change requires confirmation flow
                if (!user.emailVerified) {
                    user.email = newUserInfo.email.toLowerCase()
                    user.emailVerified = false
                }
            }
        }

        if (newUserInfo.addressId) {
            const uaddress = await this.em.findOne(UserAddress, { id: parseInt(newUserInfo.addressId) })
            if (!uaddress) {
                throw AppErrors.dbEntityNotFound('User address not found')
            }
        }

        if ((newUserInfo as any).preferences) {
            user.preferences = {
                ...(user.preferences ?? {}),
                ...(newUserInfo as any).preferences,
            }
        }

        await this.em.persistAndFlush(user)

        return user
    }

    @CreateRequestContext()
    async setEmailConfirmed(id: string) {
        const user = await this.findById(id)
        if (!user) {
            throw AppErrors.dbEntityNotFound('User not found')
        }
        user.emailVerified = true
        await this.em.persistAndFlush(user)
    }

    @CreateRequestContext()
    async setPhoneConfirmed(id: string) {
        const user = await this.findById(id)
        if (!user) {
            throw AppErrors.dbEntityNotFound('User not found')
        }
        user.phoneVerified = true
        await this.em.persistAndFlush(user)
    }

    @CreateRequestContext()
    async createPhoneUser(data: {
        phone: string;
        firstName?: string;
        lastName?: string;
        middleName?: string;
        roles: Role[];
    }): Promise<User> {
        const existing = await this.findByPhone(data.phone);
        if (existing) throw AppErrors.conflict('Пользователь с этим номером уже зарегистрирован');

        const user = this.em.create(User, {
            phone: data.phone,
            firstName: data.firstName ?? '',
            lastName: data.lastName ?? '',
            middleName: data.middleName ?? '',
            phoneVerified: true,
            emailVerified: false,
            sessions: [],
            roles: data.roles,
            providers: [AuthProvider.PHONE],
            addresses: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await this.em.persistAndFlush(user);
        return user;
    }

    @CreateRequestContext()
    async setActive(id: string, isActive: boolean) {
        const user = await this.findById(id)
        if (!user) {
            throw AppErrors.dbEntityNotFound('User not found')
        }
        user.isActive = isActive
        await this.em.persistAndFlush(user)
    }

    @CreateRequestContext()
    async addRole(id: string, role: Role) {
        const user = await this.findById(id)
        if (!user) {
            throw AppErrors.dbEntityNotFound('User not found')
        }
        if (user.roles.includes(role)) {
            throw AppErrors.badRequest('User already has this role')
        }
        user.roles.push(role)
        await this.em.persistAndFlush(user)
    }

    @CreateRequestContext()
    async removeRole(id: string, role: Role) {
        const user = await this.findById(id)
        if (!user) {
            throw AppErrors.dbEntityNotFound('User not found')
        }
        if (!user.roles.includes(role)) {
            throw AppErrors.badRequest('User does not have this role')
        }
        user.roles = user.roles.filter(r => r !== role)
        await this.em.persistAndFlush(user)
    }

    @CreateRequestContext()
    async searchUsersForChat(
        query: string,
        requesterId: string,
        requesterRoles: string[],
        limit: number = 20,
    ): Promise<Pick<User, 'id' | 'firstName' | 'lastName' | 'middleName' | 'email'>[]> {
        const isPrivileged = requesterRoles.some(r =>
            r === Role.SUPER_ADMIN || r === Role.ADMIN || r === Role.MANAGER,
        )

        const qb = this.em.createQueryBuilder(User, 'u')
            .select(['u.id', 'u.firstName', 'u.lastName', 'u.middleName', 'u.email'])
            .where({ id: { $ne: requesterId } })
            .andWhere({
                $or: [
                    { email: { $ilike: `%${query}%` } },
                    { firstName: { $ilike: `%${query}%` } },
                    { lastName: { $ilike: `%${query}%` } },
                    { middleName: { $ilike: `%${query}%` } },
                ],
            })
        if (!isPrivileged) {
            qb.andWhere(`u.preferences IS NOT NULL AND u.preferences->'chat'->>'searchable' = 'true'`)
        }

        qb.limit(limit)

        return await qb.getResult()
    }

    @CreateRequestContext()
    async removeResetTokens(userId: string) {
        const sessions = await this.em.find(Session, {
            user: { id: userId },
            type: TokenType.RESET_PASSWORD,
        });
        for (const session of sessions) {
            await this.em.removeAndFlush(session);
        }
    }

    @CreateRequestContext()
    async findByResetToken(tokenHash: string): Promise<User | null> {
        const session = await this.em.findOne(Session, {
            token: tokenHash,
            type: TokenType.RESET_PASSWORD,
        });
        if (!session) return null;
        if (session.expiresAt < new Date()) {
            await this.em.removeAndFlush(session);
            return null;
        }
        return await this.findById(session.user.id);
    }

    @CreateRequestContext()
    async resetPasswordByToken(userId: string, tokenHash: string, passwordHash: string) {
        const user = await this.findById(userId);
        if (!user) {
            throw AppErrors.dbEntityNotFound('User not found');
        }
        user.passwordHash = passwordHash;
        await this.em.persistAndFlush(user);

        // Remove the used reset token
        const session = await this.em.findOne(Session, { token: tokenHash });
        if (session) {
            await this.em.removeAndFlush(session);
        }
    }

    @CreateRequestContext()
    async setMfaPreferences(userId: string, methods: string[]) {
        const user = await this.findById(userId);
        if (!user) {
            throw AppErrors.dbEntityNotFound('User not found');
        }
        user.preferences = {
            ...(user.preferences ?? {}),
            mfa: { methods },
        };
        await this.em.persistAndFlush(user);
    }

    @CreateRequestContext()
    async changeEmail(userId: string, newEmail: string) {
        const user = await this.findById(userId);
        if (!user) {
            throw AppErrors.dbEntityNotFound('User not found');
        }
        user.email = newEmail.toLowerCase();
        user.emailVerified = false;
        await this.em.persistAndFlush(user);
    }

    @CreateRequestContext()
    async changePhone(userId: string, newPhone: string) {
        const user = await this.findById(userId);
        if (!user) {
            throw AppErrors.dbEntityNotFound('User not found');
        }
        user.phone = newPhone;
        user.phoneVerified = false;
        await this.em.persistAndFlush(user);
    }

    checkPasswordStrength(password: string) {
        if (password.length < MIN_USER_PASSWORD_LENGTH) {
            throw AppErrors.badRequest("Insufficient user password length. Must be at least " + MIN_USER_PASSWORD_LENGTH + " characters.")
        } else if (password.length >= MAX_USER_PASSWORD_LENGTH) {
            throw AppErrors.badRequest("Insufficient user password length. Must be less than " + MAX_USER_PASSWORD_LENGTH + " characters.")
        } else if (CryptoService.calculateEntropy(password).entropy < MIN_USER_PASSWORD_ENTROPY) {
            throw AppErrors.badRequest("Insufficient user password entropy. Must be at least " + MIN_USER_PASSWORD_ENTROPY + " bits.")
        }
    }

    @CreateRequestContext()
    async __createSuperAdmin(user: CreateUserDto) {
        const defaultUser = await this.em.findAll(User, { where: { roles: { $contains: [Role.SUPER_ADMIN] } } })
        if (defaultUser.length == 0) {
            console.log('Creating super admin')
            await this.create_roleWrap(user, [Role.SUPER_ADMIN])
        } else if (defaultUser.length > 1) {
            throw AppErrors.dbEntityExists('Multiple super admins found')
        }
    }
}
