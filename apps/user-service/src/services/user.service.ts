import { Injectable } from '@nestjs/common';
import { User, UserPopulateHints } from 'entities/auth/user.entity';
import { UserOAuthLink } from 'entities/auth/user-oauth-link.entity';
import { UserSettings } from 'entities/auth/user-settings.entity';
import { UserStatusHistory } from 'entities/auth/user-status-history.entity';

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

import { Session, UserAddress } from '../entities';
import { UserEventService } from './user-event.service';

const USER_SORTABLE_FIELDS = ['createdAt', 'firstName', 'lastName', 'email', 'phone', 'isActive'] as const;

@Injectable()
export class UserService {
    constructor(
        private readonly em: EntityManager,
        private readonly userEvents: UserEventService,
    ) { }

    @CreateRequestContext()
    async findAll(dto: PaginationDto & { search?: string; role?: string; status?: string; sortBy?: string; sortOrder?: string },
        relations?: Populate<User, "sessions" | "addresses" | "roles">
    ): Promise<PaginatedResponseDto<User>> {
        const limit = dto.limit ?? 10
        const offset = ((dto.page ?? 1) - 1) * limit

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
    async findByIdWithSettings(id: string): Promise<User | null> {
        return await this.em.findOne(User, { id }, { populate: ['settings'] });
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
    async findSessionAndUser(tokenHash: string): Promise<{ user: User; alreadyRotated: boolean } | null> {
        const session = await this.em.findOne(Session, { token: tokenHash })
        if (!session) {
            return null
        }

        // Defense-in-depth: reject expired sessions even if cron hasn't cleaned yet
        if (session.expiresAt < new Date()) {
            await this.em.removeAndFlush(session)
            return null
        }

        // If this session was already rotated, check the grace window
        if (session.rotatedAt) {
            const graceCutoff = new Date(session.rotatedAt.getTime() + 30_000); // 30s grace
            if (new Date() > graceCutoff) {
                // Grace period expired — potential token theft, nuke all user sessions
                await this.em.nativeDelete(Session, { user: { id: session.user.id } });
                return null
            }
            // Within grace period — allow but signal no rotation needed
            const user = await this.findById(session.user.id)
            return user ? { user, alreadyRotated: true } : null
        }

        const user = await this.findById(session.user.id)
        return user ? { user, alreadyRotated: false } : null
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
            return; // Idempotent: already removed (cron cleanup, double-click logout)
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

    @CreateRequestContext()
    async rotateSession(oldTokenHash: string, newTokenHash: string, options: {
        deviceInfo: string;
        ipAddress: string;
        expiresAt: Date;
    }): Promise<void> {
        const oldSession = await this.em.findOne(Session, { token: oldTokenHash })
        if (!oldSession) {
            throw AppErrors.dbEntityNotFound('Session not found')
        }

        // Mark old session as rotated (enters 30s grace period)
        oldSession.rotatedAt = new Date()

        // Create new session for the same user
        const newSession = this.em.create(Session, {
            token: newTokenHash,
            user: oldSession.user,
            type: TokenType.REFRESH,
            deviceInfo: options.deviceInfo,
            ipAddress: options.ipAddress,
            expiresAt: options.expiresAt,
            createdAt: new Date(),
        })

        await this.em.persistAndFlush([oldSession, newSession])
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

        if (userData.email && !userData.password) {
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

        const settings = new UserSettings();
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
            settings,

            addresses: [],

            createdAt: new Date(),
            updatedAt: new Date(),
        })

        await this.em.persistAndFlush(user)
        this.userEvents.emitUserCreated(user.id, user.roles as Role[])

        return user
    }

    @CreateRequestContext()
    async remove(id: string) {
        const user = await this.findById(id)
        if (!user) {
            throw AppErrors.dbEntityNotFound('User not found')
        }
        const userId = user.id
        await this.em.removeAndFlush(user)
        this.userEvents.emitUserDeleted(userId)
    }

    @CreateRequestContext()
    async updateSafe(id: string, _newUserInfo: DeepPartial<UpdateUserDto>, currentPassword?: string): Promise<User> {
        const needsSettings = !!((_newUserInfo as any).settings);
        const user = await this.em.findOne(User, { id }, needsSettings ? { populate: ['settings'] } : {})
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

        if (newUserInfo.settings) {
            const s = user.settings;
            if (newUserInfo.settings.mfaMethods !== undefined) {
                s.mfaMethods = newUserInfo.settings.mfaMethods as string[];
            }
            if (newUserInfo.settings.chatAcceptConversations !== undefined) {
                s.chatAcceptConversations = newUserInfo.settings.chatAcceptConversations;
            }
            if (newUserInfo.settings.chatSearchable !== undefined) {
                s.chatSearchable = newUserInfo.settings.chatSearchable;
            }
            if (newUserInfo.settings.meta !== undefined) {
                s.meta = { ...(s.meta ?? {}), ...newUserInfo.settings.meta };
            }
        }

        await this.em.persistAndFlush(user)

        // Password changed — invalidate all refresh sessions
        if (newUserInfo.password) {
            await this.em.nativeDelete(Session, {
                user: { id: user.id },
                type: TokenType.REFRESH,
            });
        }

        return user
    }

    @CreateRequestContext()
    async setEmailConfirmed(id: string) {
        const user = await this.em.findOne(User, { id })
        if (!user) throw AppErrors.dbEntityNotFound('User not found')
        user.emailVerified = true
        if (!user.providers.includes(AuthProvider.EMAIL)) {
            user.providers = [...user.providers, AuthProvider.EMAIL]
        }
        await this.em.persistAndFlush(user)
    }

    @CreateRequestContext()
    async setPhoneConfirmed(id: string) {
        const user = await this.em.findOne(User, { id })
        if (!user) throw AppErrors.dbEntityNotFound('User not found')
        user.phoneVerified = true
        if (!user.providers.includes(AuthProvider.PHONE)) {
            user.providers = [...user.providers, AuthProvider.PHONE]
        }
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

        const settings = new UserSettings();
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
            settings,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await this.em.persistAndFlush(user);
        this.userEvents.emitUserCreated(user.id, user.roles as Role[]);
        return user;
    }

    @CreateRequestContext()
    async setActive(id: string, isActive: boolean, changedBy?: string) {
        const user = await this.findById(id)
        if (!user) {
            throw AppErrors.dbEntityNotFound('User not found')
        }
        if (user.isActive !== isActive) {
            const history = new UserStatusHistory();
            history.userId = user.id;
            history.isActive = isActive;
            history.changedBy = changedBy ?? null;
            history.changedAt = new Date();
            this.em.persist(history);
        }
        user.isActive = isActive
        await this.em.persistAndFlush(user)
        this.userEvents.emitStatusChanged(user.id, isActive, changedBy);

        // When deactivating, drop all refresh sessions so no refresh is possible
        if (!isActive) {
            await this.em.nativeDelete(Session, {
                user: { id: user.id },
                type: TokenType.REFRESH,
            });
        }
    }

    @CreateRequestContext()
    async getUserStatusHistory(userId: string, dateFrom?: string, dateTo?: string): Promise<UserStatusHistory[]> {
        const where: any = { userId };
        if (dateFrom) where.changedAt = { ...where.changedAt, $gte: new Date(dateFrom) };
        if (dateTo) where.changedAt = { ...where.changedAt, $lte: new Date(dateTo) };
        return this.em.find(UserStatusHistory, where, { orderBy: { changedAt: 'ASC' } });
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
        this.userEvents.emitRoleAdded(user.id, role)
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
        this.userEvents.emitRoleRemoved(user.id, role)
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
            qb.innerJoin('u.settings', 's').andWhere({ 's.chatSearchable': true })
        }

        qb.limit(limit)

        return await qb.getResult()
    }

    @CreateRequestContext()
    async removeResetTokens(userId: string) {
        await this.em.nativeDelete(Session, {
            user: { id: userId },
            type: TokenType.RESET_PASSWORD,
        });
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
    async resetPasswordByToken(userId: string, passwordHash: string) {
        const user = await this.findById(userId);
        if (!user) {
            throw AppErrors.dbEntityNotFound('User not found');
        }
        user.passwordHash = passwordHash;
        await this.em.persistAndFlush(user);

        // Remove the used reset token + all refresh sessions (password was reset)
        await this.em.nativeDelete(Session, {
            user: { id: userId },
            type: { $in: [TokenType.RESET_PASSWORD, TokenType.REFRESH] },
        });
    }

    @CreateRequestContext()
    async setMfaMethods(userId: string, methods: string[]) {
        const user = await this.em.findOne(User, { id: userId }, { populate: ['settings'] });
        if (!user) {
            throw AppErrors.dbEntityNotFound('User not found');
        }
        user.settings.mfaMethods = methods;
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

    // ─── OAuth ────────────────────────────────────────────────────────────

    @CreateRequestContext()
    async findByOAuth(provider: string, providerId: string): Promise<User | null> {
        const link = await this.em.findOne(UserOAuthLink, { provider, providerId });
        if (!link) return null;
        return this.em.findOne(User, { id: link.userId });
    }

    @CreateRequestContext()
    async createOAuthUser(data: {
        provider: string;
        providerId: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        avatarUrl?: string;
    }): Promise<User> {
        // Check if email already exists — link to existing account instead
        if (data.email) {
            const existing = await this.em.findOne(User, { email: data.email.toLowerCase() });
            if (existing) {
                await this.linkOAuth(existing.id, data.provider, data.providerId, data.email, data.avatarUrl);
                if (!existing.providers.includes(data.provider as AuthProvider)) {
                    existing.providers = [...existing.providers, data.provider as AuthProvider];
                    await this.em.flush();
                }
                return existing;
            }
        }

        const user = new User();
        user.firstName = data.firstName;
        user.lastName = data.lastName;
        user.email = data.email?.toLowerCase();
        user.emailVerified = !!data.email; // OAuth-provided email is pre-verified
        user.providers = [data.provider as AuthProvider];
        user.roles = [DEFAULT_USER_ROLE];
        user.settings = new UserSettings();
        await this.em.persistAndFlush(user);
        this.userEvents.emitUserCreated(user.id, user.roles as Role[]);

        await this.linkOAuth(user.id, data.provider, data.providerId, data.email, data.avatarUrl);
        return user;
    }

    @CreateRequestContext()
    async linkOAuth(userId: string, provider: string, providerId: string, email?: string, avatarUrl?: string): Promise<void> {
        const existing = await this.em.findOne(UserOAuthLink, { provider, providerId });
        if (existing) {
            if (existing.userId !== userId) throw AppErrors.badRequest('Этот аккаунт уже привязан к другому пользователю');
            return; // already linked
        }
        const link = new UserOAuthLink();
        link.userId = userId;
        link.provider = provider;
        link.providerId = providerId;
        link.email = email;
        link.avatarUrl = avatarUrl;
        await this.em.persistAndFlush(link);

        // Add provider to user's providers array
        const user = await this.em.findOne(User, { id: userId });
        if (user && !user.providers.includes(provider as AuthProvider)) {
            user.providers = [...user.providers, provider as AuthProvider];
            await this.em.flush();
        }
    }

    @CreateRequestContext()
    async unlinkOAuth(userId: string, provider: string): Promise<void> {
        const link = await this.em.findOne(UserOAuthLink, { userId, provider });
        if (!link) throw AppErrors.dbEntityNotFound('OAuth link not found');

        // Don't allow unlinking if it's the only login method
        const user = await this.em.findOne(User, { id: userId });
        if (user && user.providers.length <= 1) {
            throw AppErrors.badRequest('Нельзя отключить единственный способ входа');
        }

        await this.em.removeAndFlush(link);

        if (user) {
            user.providers = user.providers.filter(p => p !== provider);
            await this.em.flush();
        }
    }

    @CreateRequestContext()
    async getOAuthLinks(userId: string): Promise<UserOAuthLink[]> {
        return this.em.find(UserOAuthLink, { userId });
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
