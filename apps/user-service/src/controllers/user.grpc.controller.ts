import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

import { AuthService } from 'services/auth.service';
import { UserService } from 'services/user.service';
import { InviteService } from 'services/invite.service';
import { AppError } from 'common/error';

import type {
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    AuthSessionResponse,
    AccessTokenResponse,
    ConfirmEmailRequest,
    ConfirmEmailResponse,
    ResendConfirmationRequest,
    RefreshTokenRequest,
    LogoutRequest,
    DevSwitchRequest,
    FindByTokenRequest,
    AuthUserResponse,
    UserIdRequest,
    PaginationRequest,
    PaginatedUsersResponse,
    UpdateUserRequest,
    ChangePasswordRequest,
    AddRoleRequest,
    RemoveRoleRequest,
    UserResponse,
    CreateInviteRequest,
    InviteCreatedResponse,
    InviteListResponse,
    InviteLinkResponse,
    InviteIdRequest,
    InviteTokenRequest,
    EmptyRequest,
    EmptyResponse,
} from '@asko/proto';

import { Role } from '@asko/shared';

function toGrpcError(error: unknown): RpcException {
    if (error instanceof AppError) {
        let grpcCode: number;
        switch (true) {
            case error.httpStatus === 401: grpcCode = status.UNAUTHENTICATED; break;
            case error.httpStatus === 403: grpcCode = status.PERMISSION_DENIED; break;
            case error.httpStatus === 404: grpcCode = status.NOT_FOUND; break;
            case error.httpStatus === 409: grpcCode = status.ALREADY_EXISTS; break;
            case error.httpStatus === 429: grpcCode = status.RESOURCE_EXHAUSTED; break;
            case error.httpStatus >= 400 && error.httpStatus < 500: grpcCode = status.INVALID_ARGUMENT; break;
            default: grpcCode = status.INTERNAL; break;
        }
        return new RpcException({ code: grpcCode, message: error.message });
    }
    const msg = error instanceof Error ? error.message : String(error);
    return new RpcException({ code: status.INTERNAL, message: msg });
}

function userToResponse(user: any): UserResponse {
    return {
        id: user.id,
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        googleId: user.googleId ?? '',
        providers: user.providers ?? [],
        roles: user.roles ?? [],
        emailVerified: user.emailVerified ?? false,
        phoneVerified: user.phoneVerified ?? false,
        createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt ?? ''),
        updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : String(user.updatedAt ?? ''),
    };
}

@Controller()
export class UserGrpcController {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService,
        private readonly inviteService: InviteService,
    ) {}

    // ─── Auth ────────────────────────────────────────────────────────────

    @GrpcMethod('UserService', 'Login')
    async login(data: LoginRequest): Promise<AuthSessionResponse> {
        try {
            const result = await this.authService.login({
                email: data.email || undefined,
                password: data.password || undefined,
                phone: data.phone || undefined,
                googleId: data.googleId || undefined,
                deviceInfo: data.deviceInfo || 'unknown',
                ipAddress: data.ipAddress || 'unknown',
            });
            return {
                accessToken: result.access_token,
                refreshToken: result.refresh_token ?? '',
                user: {
                    id: result.user.id,
                    firstName: result.user.firstName ?? '',
                    lastName: result.user.lastName ?? '',
                    email: result.user.email ?? '',
                    phone: result.user.phone ?? '',
                    googleId: result.user.googleId ?? '',
                    providers: result.user.providers ?? [],
                    roles: result.user.roles ?? [],
                    createdAt: result.user.createdAt instanceof Date ? result.user.createdAt.toISOString() : String(result.user.createdAt ?? ''),
                    updatedAt: result.user.updatedAt instanceof Date ? result.user.updatedAt.toISOString() : String(result.user.updatedAt ?? ''),
                },
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'Register')
    async register(data: RegisterRequest): Promise<RegisterResponse> {
        try {
            const result = await this.authService.register({
                dto: {
                    email: data.email || undefined,
                    password: data.password || '',
                    firstName: data.firstName || undefined,
                    lastName: data.lastName || undefined,
                    phone: data.phone || undefined,
                    googleId: data.googleId || undefined,
                },
                inviteToken: data.inviteToken || undefined,
                deviceInfo: data.deviceInfo || 'unknown',
                ipAddress: data.ipAddress || 'unknown',
            });
            return {
                accessToken: result.access_token,
                refreshToken: result.refresh_token ?? '',
                user: {
                    id: result.user.id,
                    firstName: result.user.firstName ?? '',
                    lastName: result.user.lastName ?? '',
                    email: result.user.email ?? '',
                    phone: result.user.phone ?? '',
                    googleId: result.user.googleId ?? '',
                    providers: result.user.providers ?? [],
                    roles: result.user.roles ?? [],
                    createdAt: result.user.createdAt instanceof Date ? result.user.createdAt.toISOString() : String(result.user.createdAt ?? ''),
                    updatedAt: result.user.updatedAt instanceof Date ? result.user.updatedAt.toISOString() : String(result.user.updatedAt ?? ''),
                },
                roles: result.roles ?? [],
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'ConfirmEmail')
    async confirmEmail(data: ConfirmEmailRequest): Promise<ConfirmEmailResponse> {
        try {
            const result = await this.authService.confirmEmail(data.token);
            return { message: result.message };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'ResendConfirmation')
    async resendConfirmation(data: ResendConfirmationRequest): Promise<EmptyResponse> {
        try {
            await this.authService.resendConfirmEmailToken(data.email);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'RefreshAccessToken')
    async refreshAccessToken(data: RefreshTokenRequest): Promise<AccessTokenResponse> {
        try {
            const result = await this.authService.refreshAccessToken(data.refreshToken);
            return { accessToken: result.access_token };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'Logout')
    async logout(data: LogoutRequest): Promise<EmptyResponse> {
        try {
            await this.authService.logout(data.refreshToken);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'DevSwitchAccount')
    async devSwitchAccount(data: DevSwitchRequest): Promise<AuthSessionResponse> {
        try {
            const result = await this.authService.devSwitchAccount(
                data.refreshToken,
                data.deviceInfo || 'unknown',
                data.ipAddress || 'unknown',
            );
            return {
                accessToken: result.access_token,
                refreshToken: result.refresh_token ?? '',
                user: {
                    id: result.user.id,
                    firstName: result.user.firstName ?? '',
                    lastName: result.user.lastName ?? '',
                    email: result.user.email ?? '',
                    phone: result.user.phone ?? '',
                    googleId: result.user.googleId ?? '',
                    providers: result.user.providers ?? [],
                    roles: result.user.roles ?? [],
                    createdAt: result.user.createdAt instanceof Date ? result.user.createdAt.toISOString() : String(result.user.createdAt ?? ''),
                    updatedAt: result.user.updatedAt instanceof Date ? result.user.updatedAt.toISOString() : String(result.user.updatedAt ?? ''),
                },
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'FindUserByAccessToken')
    async findUserByAccessToken(data: FindByTokenRequest): Promise<AuthUserResponse> {
        try {
            const user = await this.authService.findUserByAccessToken(data.accessToken);
            return {
                user: {
                    id: user.id,
                    firstName: user.firstName ?? '',
                    lastName: user.lastName ?? '',
                    email: user.email ?? '',
                    phone: user.phone ?? '',
                    googleId: user.googleId ?? '',
                    providers: user.providers ?? [],
                    roles: user.roles ?? [],
                    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt ?? ''),
                    updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : String(user.updatedAt ?? ''),
                },
            };
        } catch (e) { throw toGrpcError(e); }
    }

    // ─── User CRUD ───────────────────────────────────────────────────────

    @GrpcMethod('UserService', 'FindAllUsers')
    async findAllUsers(data: PaginationRequest): Promise<PaginatedUsersResponse> {
        try {
            const result = await this.userService.findAll({ offset: data.offset, limit: data.limit });
            return {
                data: result.data.map(userToResponse),
                overallCount: result.overallCount,
                offset: result.pagination.offset ?? 0,
                limit: result.pagination.limit ?? 10,
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'FindUserById')
    async findUserById(data: UserIdRequest): Promise<UserResponse> {
        try {
            const user = await this.userService.findById(data.id);
            if (!user) throw toGrpcError(new RpcException({ code: status.NOT_FOUND, message: 'User not found' }));
            return userToResponse(user);
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'DeleteUser')
    async deleteUser(data: UserIdRequest): Promise<EmptyResponse> {
        try {
            await this.userService.remove(data.id);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'UpdateUser')
    async updateUser(data: UpdateUserRequest): Promise<UserResponse> {
        try {
            const updateDto: any = {};
            if (data.name) updateDto.name = data.name;
            if (data.email) updateDto.email = data.email;
            if (data.phone) updateDto.phone = data.phone;
            if (data.password) updateDto.password = data.password;
            if (data.addressId) updateDto.addressId = data.addressId;

            const user = await this.userService.updateSafe(data.id, updateDto, data.currentPassword || undefined);
            return userToResponse(user);
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'ChangePassword')
    async changePassword(data: ChangePasswordRequest): Promise<UserResponse> {
        try {
            const user = await this.userService.updateSafe(
                data.id,
                { password: data.newPassword },
                data.oldPassword,
            );
            return userToResponse(user);
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'GetProfile')
    async getProfile(data: UserIdRequest): Promise<UserResponse> {
        try {
            const user = await this.userService.findById(data.id);
            if (!user) throw toGrpcError(new RpcException({ code: status.NOT_FOUND, message: 'User not found' }));
            return userToResponse(user);
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'SetEmailConfirmed')
    async setEmailConfirmed(data: UserIdRequest): Promise<EmptyResponse> {
        try {
            await this.userService.setEmailConfirmed(data.id);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'AddRole')
    async addRole(data: AddRoleRequest): Promise<EmptyResponse> {
        try {
            await this.userService.addRole(data.id, data.role as Role);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'RemoveRole')
    async removeRole(data: RemoveRoleRequest): Promise<EmptyResponse> {
        try {
            await this.userService.removeRole(data.id, data.role as Role);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    // ─── Invite ──────────────────────────────────────────────────────────

    @GrpcMethod('UserService', 'CreateInvite')
    async createInvite(data: CreateInviteRequest): Promise<InviteCreatedResponse> {
        try {
            const result = await this.inviteService.create(
                { role: data.role as Role, ttl: data.ttl || undefined },
                data.creatorId,
            );
            return {
                invite: {
                    id: result.invite.id,
                    token: result.invite.token,
                    role: result.invite.role,
                    ttl: result.invite.ttl,
                    used: result.invite.used,
                    expiresAt: result.invite.expiresAt instanceof Date ? result.invite.expiresAt.toISOString() : String(result.invite.expiresAt),
                    createdAt: result.invite.createdAt instanceof Date ? result.invite.createdAt.toISOString() : String(result.invite.createdAt),
                },
                link: result.link,
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'FindAllInvites')
    async findAllInvites(_data: EmptyRequest): Promise<InviteListResponse> {
        try {
            const invites = await this.inviteService.findAll();
            return {
                invites: invites.map(inv => ({
                    id: inv.id,
                    token: inv.token,
                    role: inv.role,
                    ttl: inv.ttl,
                    used: inv.used,
                    expiresAt: inv.expiresAt instanceof Date ? inv.expiresAt.toISOString() : String(inv.expiresAt),
                    createdAt: inv.createdAt instanceof Date ? inv.createdAt.toISOString() : String(inv.createdAt),
                })),
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'CheckInvite')
    async checkInvite(data: InviteTokenRequest): Promise<InviteLinkResponse> {
        try {
            const inv = await this.inviteService.checkInvite(data.token);
            return {
                id: inv.id,
                token: inv.token,
                role: inv.role,
                ttl: inv.ttl,
                used: inv.used,
                expiresAt: inv.expiresAt instanceof Date ? inv.expiresAt.toISOString() : String(inv.expiresAt),
                createdAt: inv.createdAt instanceof Date ? inv.createdAt.toISOString() : String(inv.createdAt),
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'DeleteInvite')
    async deleteInvite(data: InviteIdRequest): Promise<EmptyResponse> {
        try {
            await this.inviteService.remove(data.id);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }
}
