import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { AppError, AppErrors, AppErrorTypeEnum } from 'common/error';

import type {
    UserServiceClient,
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
    EmptyResponse,
} from '@asko/proto';

function fromGrpcError(error: any): never {
    if (error?.code !== undefined && error?.message) {
        const msg = error.details || error.message;
        let appErrorType: AppErrorTypeEnum;
        switch (error.code) {
            case 5: appErrorType = AppErrorTypeEnum.DB_ENTITY_NOT_FOUND; break;   // NOT_FOUND
            case 6: appErrorType = AppErrorTypeEnum.DB_ENTITY_EXISTS; break;       // ALREADY_EXISTS
            case 3: appErrorType = AppErrorTypeEnum.INVALID_DATA; break;           // INVALID_ARGUMENT
            case 16: appErrorType = AppErrorTypeEnum.UNAUTHORIZED; break;          // UNAUTHENTICATED
            case 7: appErrorType = AppErrorTypeEnum.FORBIDDEN; break;              // PERMISSION_DENIED
            case 8: appErrorType = AppErrorTypeEnum.TOO_MANY_REQUESTS; break;      // RESOURCE_EXHAUSTED
            default: appErrorType = AppErrorTypeEnum.INTERNAL_ERROR; break;
        }
        throw new AppError(appErrorType, { message: msg });
    }
    if (error instanceof AppError) throw error;
    throw AppErrors.internalError(error?.message ?? 'gRPC call failed');
}

@Injectable()
export class UserClientService implements OnModuleInit {
    private userService!: UserServiceClient;

    constructor(
        @Inject('USER_PACKAGE') private readonly client: ClientGrpc,
    ) {}

    onModuleInit() {
        this.userService = this.client.getService<UserServiceClient>('UserService');
    }

    // ─── Auth ────────────────────────────────────────────────────────────

    async login(data: LoginRequest): Promise<AuthSessionResponse> {
        try {
            return await lastValueFrom(this.userService.login(data));
        } catch (e) { fromGrpcError(e); }
    }

    async register(data: RegisterRequest): Promise<RegisterResponse> {
        try {
            return await lastValueFrom(this.userService.register(data));
        } catch (e) { fromGrpcError(e); }
    }

    async confirmEmail(data: ConfirmEmailRequest): Promise<ConfirmEmailResponse> {
        try {
            return await lastValueFrom(this.userService.confirmEmail(data));
        } catch (e) { fromGrpcError(e); }
    }

    async resendConfirmation(data: ResendConfirmationRequest): Promise<EmptyResponse> {
        try {
            return await lastValueFrom(this.userService.resendConfirmation(data));
        } catch (e) { fromGrpcError(e); }
    }

    async refreshAccessToken(data: RefreshTokenRequest): Promise<AccessTokenResponse> {
        try {
            return await lastValueFrom(this.userService.refreshAccessToken(data));
        } catch (e) { fromGrpcError(e); }
    }

    async logout(data: LogoutRequest): Promise<EmptyResponse> {
        try {
            return await lastValueFrom(this.userService.logout(data));
        } catch (e) { fromGrpcError(e); }
    }

    async devSwitchAccount(data: DevSwitchRequest): Promise<AuthSessionResponse> {
        try {
            return await lastValueFrom(this.userService.devSwitchAccount(data));
        } catch (e) { fromGrpcError(e); }
    }

    async findUserByAccessToken(data: FindByTokenRequest): Promise<AuthUserResponse> {
        try {
            return await lastValueFrom(this.userService.findUserByAccessToken(data));
        } catch (e) { fromGrpcError(e); }
    }

    // ─── User CRUD ───────────────────────────────────────────────────────

    async findAllUsers(data: PaginationRequest): Promise<PaginatedUsersResponse> {
        try {
            return await lastValueFrom(this.userService.findAllUsers(data));
        } catch (e) { fromGrpcError(e); }
    }

    async findUserById(data: UserIdRequest): Promise<UserResponse> {
        try {
            return await lastValueFrom(this.userService.findUserById(data));
        } catch (e) { fromGrpcError(e); }
    }

    async deleteUser(data: UserIdRequest): Promise<EmptyResponse> {
        try {
            return await lastValueFrom(this.userService.deleteUser(data));
        } catch (e) { fromGrpcError(e); }
    }

    async updateUser(data: UpdateUserRequest): Promise<UserResponse> {
        try {
            return await lastValueFrom(this.userService.updateUser(data));
        } catch (e) { fromGrpcError(e); }
    }

    async changePassword(data: ChangePasswordRequest): Promise<UserResponse> {
        try {
            return await lastValueFrom(this.userService.changePassword(data));
        } catch (e) { fromGrpcError(e); }
    }

    async getProfile(data: UserIdRequest): Promise<UserResponse> {
        try {
            return await lastValueFrom(this.userService.getProfile(data));
        } catch (e) { fromGrpcError(e); }
    }

    async setEmailConfirmed(data: UserIdRequest): Promise<EmptyResponse> {
        try {
            return await lastValueFrom(this.userService.setEmailConfirmed(data));
        } catch (e) { fromGrpcError(e); }
    }

    async addRole(data: AddRoleRequest): Promise<EmptyResponse> {
        try {
            return await lastValueFrom(this.userService.addRole(data));
        } catch (e) { fromGrpcError(e); }
    }

    async removeRole(data: RemoveRoleRequest): Promise<EmptyResponse> {
        try {
            return await lastValueFrom(this.userService.removeRole(data));
        } catch (e) { fromGrpcError(e); }
    }

    // ─── Invite ──────────────────────────────────────────────────────────

    async createInvite(data: CreateInviteRequest): Promise<InviteCreatedResponse> {
        try {
            return await lastValueFrom(this.userService.createInvite(data));
        } catch (e) { fromGrpcError(e); }
    }

    async findAllInvites(): Promise<InviteListResponse> {
        try {
            return await lastValueFrom(this.userService.findAllInvites({}));
        } catch (e) { fromGrpcError(e); }
    }

    async checkInvite(data: InviteTokenRequest): Promise<InviteLinkResponse> {
        try {
            return await lastValueFrom(this.userService.checkInvite(data));
        } catch (e) { fromGrpcError(e); }
    }

    async deleteInvite(data: InviteIdRequest): Promise<EmptyResponse> {
        try {
            return await lastValueFrom(this.userService.deleteInvite(data));
        } catch (e) { fromGrpcError(e); }
    }
}
