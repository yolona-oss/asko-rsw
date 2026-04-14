import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

import { AuthService } from 'services/auth.service';
import { UserService } from 'services/user.service';
import { InviteService } from 'services/invite.service';
import { MfaService } from 'services/mfa.service';
import { SigningService } from 'services/signing.service';
import { AppError } from 'common/error';

import type {
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    AuthSessionResponse,
    RefreshTokenResponse,
    ConfirmEmailRequest,
    ConfirmEmailResponse,
    ResendConfirmationRequest,
    ResendConfirmationResponse,
    RefreshTokenRequest,
    LogoutRequest,
    FindByTokenRequest,
    AuthUserResponse,
    UserIdRequest,
    FindByEmailRequest,
    FindAllUsersRequest,
    PaginatedUsersResponse,
    UpdateUserRequest,
    ChangePasswordRequest,
    AddRoleRequest,
    RemoveRoleRequest,
    SetUserActiveRequest,
    GetUserStatusHistoryRequest,
    UserStatusHistoryResponse,
    UserResponse,
    CreateInviteRequest,
    InviteCreatedResponse,
    InviteListResponse,
    InviteLinkResponse,
    InviteIdRequest,
    InviteTokenRequest,
    EmptyRequest,
    EmptyResponse,
    SearchUsersForChatRequest,
    SearchUsersForChatResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    RequestEmailChangeRequest,
    RequestEmailChangeResponse,
    ConfirmEmailChangeRequest,
    ConfirmEmailChangeResponse,
    LoginResponse,
    VerifyMfaRequest,
    VerifyMfaResponse,
    ResendMfaOtpRequest,
    ResendMfaOtpResponse,
    EnableMfaRequest,
    EnableMfaResponse,
    VerifyEnableMfaRequest,
    VerifyEnableMfaResponse,
    InitiateDisableMfaRequest,
    InitiateDisableMfaResponse,
    ConfirmDisableMfaRequest,
    ConfirmDisableMfaResponse,
    GetMfaStatusRequest,
    GetMfaStatusResponse,
    OAuthLoginRequest,
    LinkOAuthRequest,
    UnlinkOAuthRequest,
    OAuthLinksResponse,
    SendSigningOtpRequest,
    SendSigningOtpResponse,
    VerifySigningOtpRequest,
    VerifySigningOtpResponse,
    VerifyPasswordForSigningRequest,
    VerifyPasswordForSigningResponse,
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

// Project settings only if the lazy relation has been populated (not a Reference proxy)
function settingsToProto(user: any): { mfaMethods: string[]; chatAcceptConversations: boolean; chatSearchable: boolean; metaJson: string } | undefined {
    const s = user.settings;
    if (!s || typeof s !== 'object' || s.__helper) return undefined;
    return {
        mfaMethods: s.mfaMethods ?? [],
        chatAcceptConversations: !!s.chatAcceptConversations,
        chatSearchable: !!s.chatSearchable,
        metaJson: s.meta ? JSON.stringify(s.meta) : '',
    };
}

function userToResponse(user: any): UserResponse {
    return {
        id: user.id,
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        middleName: user.middleName ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        googleId: user.googleId ?? '',
        providers: user.providers ?? [],
        roles: user.roles ?? [],
        emailVerified: user.emailVerified ?? false,
        phoneVerified: user.phoneVerified ?? false,
        isActive: user.isActive ?? true,
        createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt ?? ''),
        updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : String(user.updatedAt ?? ''),
        settings: settingsToProto(user),
    };
}

function userToAuthUser(user: any) {
    return {
        id: user.id,
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        middleName: user.middleName ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        googleId: user.googleId ?? '',
        providers: user.providers ?? [],
        roles: user.roles ?? [],
        isActive: user.isActive ?? true,
        createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt ?? ''),
        updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : String(user.updatedAt ?? ''),
        settings: settingsToProto(user),
    };
}

@Controller()
export class UserGrpcController {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService,
        private readonly inviteService: InviteService,
        private readonly mfaService: MfaService,
        private readonly signingService: SigningService,
    ) {}

    // ─── Auth ────────────────────────────────────────────────────────────

    @GrpcMethod('UserService', 'Login')
    async login(data: LoginRequest): Promise<LoginResponse> {
        try {
            const result = await this.authService.login({
                email: data.email || undefined,
                password: data.password || undefined,
                phone: data.phone || undefined,
                googleId: data.googleId || undefined,
                deviceInfo: data.deviceInfo || 'unknown',
                ipAddress: data.ipAddress || 'unknown',
                trustedDeviceToken: data.trustedDeviceToken || undefined,
            });
            return {
                status: result.status,
                accessToken: result.access_token ?? '',
                refreshToken: result.refresh_token ?? '',
                user: result.user ? userToAuthUser(result.user) : undefined,
                mfaToken: result.mfa_token ?? '',
                mfaMethod: result.mfa_method ?? '',
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'Register')
    async register(data: RegisterRequest): Promise<RegisterResponse> {
        try {
            const result = await this.authService.register({
                dto: {
                    email: data.email || undefined,
                    password: data.password || undefined,
                    firstName: data.firstName || undefined,
                    lastName: data.lastName || undefined,
                    middleName: data.middleName || undefined,
                    phone: data.phone || undefined,
                    googleId: data.googleId || undefined,
                },
                inviteToken: data.inviteToken || undefined,
                deviceInfo: data.deviceInfo || 'unknown',
                ipAddress: data.ipAddress || 'unknown',
            });

            if ('status' in result && result.status === 'OTP_REQUIRED') {
                return {
                    status: 'OTP_REQUIRED',
                    pendingToken: result.pendingToken,
                    accessToken: '',
                    refreshToken: '',
                    user: undefined as any,
                    roles: [],
                };
            }

            const session = result as any;
            return {
                status: 'SUCCESS',
                pendingToken: '',
                accessToken: session.access_token,
                refreshToken: session.refresh_token ?? '',
                user: userToAuthUser(session.user),
                roles: session.roles ?? [],
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
    async resendConfirmation(data: ResendConfirmationRequest): Promise<ResendConfirmationResponse> {
        try {
            const result = await this.authService.resendConfirmEmailToken(data.email);
            return { retryAfter: result.retryAfter };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'RefreshAccessToken')
    async refreshAccessToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
        try {
            const result = await this.authService.refreshAccessToken(
                data.refreshToken,
                data.deviceInfo || 'unknown',
                data.ipAddress || 'unknown',
            );
            return {
                accessToken: result.access_token,
                refreshToken: result.refresh_token ?? '',
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'Logout')
    async logout(data: LogoutRequest): Promise<EmptyResponse> {
        try {
            await this.authService.logout(data.refreshToken);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'FindUserByAccessToken')
    async findUserByAccessToken(data: FindByTokenRequest): Promise<AuthUserResponse> {
        try {
            const user = await this.authService.findUserByAccessToken(data.accessToken);
            return {
                user: userToAuthUser(user),
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'ForgotPassword')
    async forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
        try {
            const result = await this.authService.forgotPassword(data.email);
            return { message: result.message, retryAfter: result.retryAfter };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'ResetPassword')
    async resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
        try {
            const result = await this.authService.resetPassword(data.token, data.newPassword);
            return { message: result.message };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'RequestEmailChange')
    async requestEmailChange(data: RequestEmailChangeRequest): Promise<RequestEmailChangeResponse> {
        try {
            const result = await this.authService.requestEmailChange(data.id, data.newEmail);
            return { message: result.message, retryAfter: result.retryAfter };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'ConfirmEmailChange')
    async confirmEmailChange(data: ConfirmEmailChangeRequest): Promise<ConfirmEmailChangeResponse> {
        try {
            const result = await this.authService.confirmEmailChange(data.token);
            return { message: result.message };
        } catch (e) { throw toGrpcError(e); }
    }

    // ─── MFA ──────────────────────────────────────────────────────────────

    @GrpcMethod('UserService', 'VerifyMfaOtp')
    async verifyMfaOtp(data: VerifyMfaRequest): Promise<VerifyMfaResponse> {
        try {
            const result = await this.authService.verifyMfaOtp(
                data.mfaToken,
                data.code,
                data.trustDevice,
                data.deviceInfo || 'unknown',
                data.ipAddress || 'unknown',
            );
            return {
                accessToken: result.access_token,
                refreshToken: result.refresh_token,
                user: userToAuthUser(result.user),
                trustedDeviceToken: result.trusted_device_token ?? '',
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'ResendMfaOtp')
    async resendMfaOtp(data: ResendMfaOtpRequest): Promise<ResendMfaOtpResponse> {
        try {
            const result = await this.mfaService.resendLoginOtp(data.mfaToken);
            return { retryAfter: result.retryAfter };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'EnableMfa')
    async enableMfa(data: EnableMfaRequest): Promise<EnableMfaResponse> {
        try {
            const result = await this.mfaService.initiateEnableMfa(data.userId);
            return { message: result.message, retryAfter: result.retryAfter };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'VerifyEnableMfa')
    async verifyEnableMfa(data: VerifyEnableMfaRequest): Promise<VerifyEnableMfaResponse> {
        try {
            await this.mfaService.confirmEnableMfa(data.userId, data.code);
            return { message: 'MFA включена' };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'InitiateDisableMfa')
    async initiateDisableMfa(data: InitiateDisableMfaRequest): Promise<InitiateDisableMfaResponse> {
        try {
            const result = await this.mfaService.initiateDisableMfa(data.userId);
            return { message: result.message, retryAfter: result.retryAfter };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'ConfirmDisableMfa')
    async confirmDisableMfa(data: ConfirmDisableMfaRequest): Promise<ConfirmDisableMfaResponse> {
        try {
            await this.mfaService.confirmDisableMfa(data.userId, data.code);
            return { message: 'MFA отключена' };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'GetMfaStatus')
    async getMfaStatus(data: GetMfaStatusRequest): Promise<GetMfaStatusResponse> {
        try {
            return await this.mfaService.getMfaStatus(data.userId);
        } catch (e) { throw toGrpcError(e); }
    }

    // ─── Phone Register ─────────────────────────────────────────────────

    @GrpcMethod('UserService', 'VerifyPhoneRegister')
    async verifyPhoneRegister(data: any): Promise<RegisterResponse> {
        try {
            const result = await this.authService.verifyPhoneRegister(
                data.pendingToken,
                data.code,
                data.deviceInfo || 'unknown',
                data.ipAddress || 'unknown',
            );
            return {
                status: 'SUCCESS',
                pendingToken: '',
                accessToken: result.access_token,
                refreshToken: result.refresh_token ?? '',
                user: userToAuthUser(result.user),
                roles: result.roles ?? [],
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'ResendPhoneRegisterOtp')
    async resendPhoneRegisterOtp(data: any): Promise<{ retryAfter: number }> {
        try {
            return await this.authService.resendPhoneRegisterOtp(data.pendingToken);
        } catch (e) { throw toGrpcError(e); }
    }

    // ─── Phone Verification ────────────────────────────────────────────

    @GrpcMethod('UserService', 'SendPhoneVerification')
    async sendPhoneVerification(data: any): Promise<{ message: string; retryAfter: number }> {
        try {
            return await this.authService.sendPhoneVerification(data.userId);
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'ConfirmPhoneVerification')
    async confirmPhoneVerification(data: any): Promise<{ message: string }> {
        try {
            return await this.authService.confirmPhoneVerification(data.userId, data.code);
        } catch (e) { throw toGrpcError(e); }
    }

    // ─── Phone Change ─────────────────────────────────────────────────

    @GrpcMethod('UserService', 'RequestPhoneChange')
    async requestPhoneChange(data: any): Promise<{ message: string; retryAfter: number }> {
        try {
            return await this.authService.requestPhoneChange(data.userId, data.newPhone);
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'ConfirmPhoneChange')
    async confirmPhoneChange(data: any): Promise<{ message: string }> {
        try {
            return await this.authService.confirmPhoneChange(data.userId, data.code);
        } catch (e) { throw toGrpcError(e); }
    }

    // ─── User CRUD ───────────────────────────────────────────────────────

    @GrpcMethod('UserService', 'FindAllUsers')
    async findAllUsers(data: FindAllUsersRequest): Promise<PaginatedUsersResponse> {
        try {
            const result = await this.userService.findAll({
                page: data.page,
                limit: data.limit,
                search: data.search || undefined,
                role: data.role || undefined,
                status: data.status || undefined,
                sortBy: data.sortBy || undefined,
                sortOrder: (data.sortOrder || undefined) as 'asc' | 'desc' | undefined,
            });
            return {
                data: result.data.map(userToResponse),
                overallCount: result.overallCount,
                page: result.pagination.page ?? 0,
                limit: result.pagination.limit ?? 10,
                sortBy: data.sortBy ?? '',
                sortOrder: data.sortOrder ?? '',
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'FindUserById')
    async findUserById(data: UserIdRequest): Promise<UserResponse> {
        try {
            const user = await this.userService.findByIdWithSettings(data.id);
            if (!user) throw toGrpcError(new RpcException({ code: status.NOT_FOUND, message: 'User not found' }));
            return userToResponse(user);
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'FindUserByEmail')
    async findUserByEmail(data: FindByEmailRequest): Promise<UserResponse> {
        try {
            const user = await this.userService.findByEmail(data.email);
            if (!user) throw new RpcException({ code: status.NOT_FOUND, message: 'User not found' });
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
            if (data.middleName !== undefined) updateDto.middleName = data.middleName;
            if (data.email) updateDto.email = data.email;
            if (data.phone) updateDto.phone = data.phone;
            if (data.password) updateDto.password = data.password;
            if (data.addressId) updateDto.addressId = data.addressId;
            if (data.settings) {
                updateDto.settings = {
                    mfaMethods: data.settings.mfaMethods,
                    chatAcceptConversations: data.settings.chatAcceptConversations,
                    chatSearchable: data.settings.chatSearchable,
                    meta: data.settings.metaJson ? (() => { try { return JSON.parse(data.settings!.metaJson); } catch { return undefined; } })() : undefined,
                };
            }

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
            const user = await this.userService.findByIdWithSettings(data.id);
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

    @GrpcMethod('UserService', 'SetUserActive')
    async setUserActive(data: SetUserActiveRequest): Promise<EmptyResponse> {
        try {
            await this.userService.setActive(data.id, data.isActive, data.changedBy);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'GetUserStatusHistory')
    async getUserStatusHistory(data: GetUserStatusHistoryRequest): Promise<UserStatusHistoryResponse> {
        try {
            const rows = await this.userService.getUserStatusHistory(data.userId, data.dateFrom, data.dateTo);
            return {
                data: rows.map((r) => ({
                    id: r.id,
                    userId: r.userId,
                    isActive: r.isActive,
                    changedBy: r.changedBy ?? '',
                    changedAt: r.changedAt.toISOString(),
                })),
            };
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

    // ─── Chat ─────────────────────────────────────────────────────────────

    @GrpcMethod('UserService', 'SearchUsersForChat')
    async searchUsersForChat(data: SearchUsersForChatRequest): Promise<SearchUsersForChatResponse> {
        try {
            const users = await this.userService.searchUsersForChat(
                data.query,
                data.requesterId,
                data.requesterRoles ?? [],
                data.limit || 20,
            );
            return {
                users: users.map(u => ({
                    id: u.id,
                    firstName: u.firstName ?? '',
                    lastName: u.lastName ?? '',
                    middleName: u.middleName ?? '',
                    email: u.email ?? '',
                })),
            };
        } catch (e) { throw toGrpcError(e); }
    }

    // ─── OAuth ────────────────────────────────────────────────────────────

    @GrpcMethod('UserService', 'OAuthLogin')
    async oAuthLogin(data: OAuthLoginRequest): Promise<LoginResponse> {
        try {
            const result = await this.authService.oauthLogin({
                provider: data.provider,
                providerId: data.providerId,
                email: data.email || undefined,
                firstName: data.firstName || undefined,
                lastName: data.lastName || undefined,
                avatarUrl: data.avatarUrl || undefined,
                deviceInfo: data.deviceInfo || 'unknown',
                ipAddress: data.ipAddress || 'unknown',
            });
            return {
                status: result.status,
                accessToken: result.access_token ?? '',
                refreshToken: result.refresh_token ?? '',
                user: result.user ? userToAuthUser(result.user) : undefined,
                mfaToken: '',
                mfaMethod: '',
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'LinkOAuth')
    async linkOAuth(data: LinkOAuthRequest): Promise<EmptyResponse> {
        try {
            await this.userService.linkOAuth(data.userId, data.provider, data.providerId, data.email || undefined, data.avatarUrl || undefined);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'UnlinkOAuth')
    async unlinkOAuth(data: UnlinkOAuthRequest): Promise<EmptyResponse> {
        try {
            await this.userService.unlinkOAuth(data.userId, data.provider);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'GetOAuthLinks')
    async getOAuthLinks(data: UserIdRequest): Promise<OAuthLinksResponse> {
        try {
            const links = await this.userService.getOAuthLinks(data.id);
            return {
                links: links.map(l => ({
                    id: l.id,
                    userId: l.userId,
                    provider: l.provider,
                    providerId: l.providerId,
                    email: l.email ?? '',
                    avatarUrl: l.avatarUrl ?? '',
                    createdAt: l.createdAt.toISOString(),
                })),
            };
        } catch (e) { throw toGrpcError(e); }
    }

    // ─── Signing OTP (AVR digital signatures) ──────────────────────────

    @GrpcMethod('UserService', 'SendSigningOtp')
    async sendSigningOtp(data: SendSigningOtpRequest): Promise<SendSigningOtpResponse> {
        try {
            return await this.signingService.sendSigningOtp(data.userId);
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'VerifySigningOtp')
    async verifySigningOtp(data: VerifySigningOtpRequest): Promise<VerifySigningOtpResponse> {
        try {
            return await this.signingService.verifySigningOtp(data.userId, data.code);
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('UserService', 'VerifyPasswordForSigning')
    async verifyPasswordForSigning(data: VerifyPasswordForSigningRequest): Promise<VerifyPasswordForSigningResponse> {
        try {
            return await this.signingService.verifyPasswordForSigning(data.userId, data.password);
        } catch (e) { throw toGrpcError(e); }
    }
}
