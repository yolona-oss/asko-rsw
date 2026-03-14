import { Injectable } from '@nestjs/common';
import { User, UserPopulateHints } from 'entities/auth/user.entity';

// import { ImageUploadService } from 'modules/file-upload/services/image-upload.service';

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
    ImageTypeEnum,
} from '@asko/shared';

import { Writeable } from 'types/writable.type';
import { EntityManager } from '@mikro-orm/postgresql';
import { CreateRequestContext, Populate } from '@mikro-orm/core';

import { Session, UserAddress } from 'entities';
import { AddressService } from 'modules/address/services/address.service';
import { ImageService } from 'modules/file-upload/services/image.service';

@Injectable()
export class UserService {
    constructor(
        private readonly addressService: AddressService,
        private readonly em: EntityManager,
        private readonly imagesService: ImageService
    ) { }

    @CreateRequestContext()
    async findAll(dto: PaginationDto,
        relations?: Populate<User, "sessions" | "addresses" | "roles" | "employeeAssignments">
    ): Promise<PaginatedResponseDto<User>> {
        const offset = dto.offset ?? 1
        const limit = dto.limit ?? 10

        const [entities, overallCount] = await this.em.findAndCount(User, {}, {
            offset,
            limit,
            populate: relations,
        })

        return {
            data: entities,
            overallCount,
            pagination: {
                offset,
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
    async findByEmail(email: string, relations?: Populate<User, UserPopulateHints>): Promise<User | null>  {
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
    private async create_roleWrap(userData: CreateUserDto, provideRoles: Role[] = [DEFAULT_USER_ROLE]) {
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

        // throw falls
        this.checkPasswordStrenth(userData.password)

        const passwordHash = await CryptoService.createPasswordHash(userData.password)
        const user = this.em.create(User, {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email?.toLowerCase(),
            phone: userData.phone,
            passwordHash,
            emailVerified: false,
            phoneVerified: false,
            sessions: [],
            roles: provideRoles,
            providers: [provider],

            addresses: [],
            employeeAssignments: [],

            createdAt: new Date(),
            updatedAt: new Date(),
        })

        await this.em.persistAndFlush(user)

        try {
            const default_avatar_e = await this.imagesService.findBlank(ImageTypeEnum.User)
            await this.imagesService.attachImage(default_avatar_e.id, { ownerId: user.id, ownerType: ImageTypeEnum.User })
        } catch {
            // Blank image not yet seeded — user is created without a default avatar
        }

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

    // TODO add image uplaoding, password safety updating
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

        // TODO send verification from auth service

        if (newUserInfo.password) {
            // for clean email pass credentials
            if (newUserInfo.email && !user.email && !user.passwordHash) {
                user.passwordHash = await CryptoService.createPasswordHash(newUserInfo.password)
            } else if (currentPassword && user.passwordHash) { // for password update
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
            const [ firstName, lastName ] = newUserInfo.name.split(' ')
            user.firstName = firstName
            user.lastName = lastName
        }

        if (newUserInfo.phone) {
            if (user.phone !== newUserInfo.phone) {
                user.phone = newUserInfo.phone
                user.phoneVerified = false
            }
        }

        if (newUserInfo.email) {
            if (user.email !== newUserInfo.email.toLowerCase()) {
                user.email = newUserInfo.email.toLowerCase()
                user.emailVerified = false
            }
        }

        if (newUserInfo.addressId) {
            const uaddress = await this.em.findOne(UserAddress, { id: parseInt(newUserInfo.addressId) })
            if (!uaddress) {
                throw AppErrors.dbEntityNotFound('User address not found')
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

    /***
    * Checks password strenth by entropy
    * on not enough entropy, throws
    */
    private checkPasswordStrenth(password: string) {
        if (password.length < MIN_USER_PASSWORD_LENGTH) {
            throw AppErrors.badRequest("Insufficient user password length. Must be at least " + MIN_USER_PASSWORD_LENGTH + " characters.")
        } else if (password.length >= MAX_USER_PASSWORD_LENGTH) {
            throw AppErrors.badRequest("Insufficient user password length. Must be less than " + MAX_USER_PASSWORD_LENGTH + " characters.")
        } else if (CryptoService.calculateEntropy(password).entropy < MIN_USER_PASSWORD_ENTROPY) {
            throw AppErrors.badRequest("Insufficient user password entropy. Must be at least " + MIN_USER_PASSWORD_ENTROPY + " bits.")
        }
    }

    /***
    * Creates super admin if one does not exist and there is only one super admin
    */
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
