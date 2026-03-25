import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcCall } from 'common/grpc';

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
    SearchUsersForChatRequest,
    SearchUsersForChatResponse,
} from '@asko/proto';

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

    login(data: LoginRequest): Promise<AuthSessionResponse> {
        return grpcCall(this.userService.login(data));
    }

    register(data: RegisterRequest): Promise<RegisterResponse> {
        return grpcCall(this.userService.register(data));
    }

    confirmEmail(data: ConfirmEmailRequest): Promise<ConfirmEmailResponse> {
        return grpcCall(this.userService.confirmEmail(data));
    }

    resendConfirmation(data: ResendConfirmationRequest): Promise<EmptyResponse> {
        return grpcCall(this.userService.resendConfirmation(data));
    }

    refreshAccessToken(data: RefreshTokenRequest): Promise<AccessTokenResponse> {
        return grpcCall(this.userService.refreshAccessToken(data));
    }

    logout(data: LogoutRequest): Promise<EmptyResponse> {
        return grpcCall(this.userService.logout(data));
    }

    devSwitchAccount(data: DevSwitchRequest): Promise<AuthSessionResponse> {
        return grpcCall(this.userService.devSwitchAccount(data));
    }

    findUserByAccessToken(data: FindByTokenRequest): Promise<AuthUserResponse> {
        return grpcCall(this.userService.findUserByAccessToken(data));
    }

    // ─── User CRUD ───────────────────────────────────────────────────────

    findAllUsers(data: PaginationRequest): Promise<PaginatedUsersResponse> {
        return grpcCall(this.userService.findAllUsers(data));
    }

    findUserById(data: UserIdRequest): Promise<UserResponse> {
        return grpcCall(this.userService.findUserById(data));
    }

    deleteUser(data: UserIdRequest): Promise<EmptyResponse> {
        return grpcCall(this.userService.deleteUser(data));
    }

    updateUser(data: UpdateUserRequest): Promise<UserResponse> {
        return grpcCall(this.userService.updateUser(data));
    }

    changePassword(data: ChangePasswordRequest): Promise<UserResponse> {
        return grpcCall(this.userService.changePassword(data));
    }

    getProfile(data: UserIdRequest): Promise<UserResponse> {
        return grpcCall(this.userService.getProfile(data));
    }

    setEmailConfirmed(data: UserIdRequest): Promise<EmptyResponse> {
        return grpcCall(this.userService.setEmailConfirmed(data));
    }

    addRole(data: AddRoleRequest): Promise<EmptyResponse> {
        return grpcCall(this.userService.addRole(data));
    }

    removeRole(data: RemoveRoleRequest): Promise<EmptyResponse> {
        return grpcCall(this.userService.removeRole(data));
    }

    // ─── Invite ──────────────────────────────────────────────────────────

    createInvite(data: CreateInviteRequest): Promise<InviteCreatedResponse> {
        return grpcCall(this.userService.createInvite(data));
    }

    findAllInvites(): Promise<InviteListResponse> {
        return grpcCall(this.userService.findAllInvites({}));
    }

    checkInvite(data: InviteTokenRequest): Promise<InviteLinkResponse> {
        return grpcCall(this.userService.checkInvite(data));
    }

    deleteInvite(data: InviteIdRequest): Promise<EmptyResponse> {
        return grpcCall(this.userService.deleteInvite(data));
    }

    // ─── Chat ──────────────────────────────────────────────────────────

    searchUsersForChat(data: SearchUsersForChatRequest): Promise<SearchUsersForChatResponse> {
        return grpcCall(this.userService.searchUsersForChat(data));
    }
}
