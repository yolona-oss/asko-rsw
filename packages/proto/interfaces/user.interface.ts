import { Observable } from 'rxjs';

// ─── Auth Messages ───────────────────────────────────────────────────────────

export interface LoginRequest {
    email: string;
    password: string;
    phone: string;
    googleId: string;
    deviceInfo: string;
    ipAddress: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    googleId: string;
    inviteToken: string;
    deviceInfo: string;
    ipAddress: string;
}

export interface RegisterResponse {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
    roles: string[];
}

export interface AuthSessionResponse {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
}

export interface AccessTokenResponse {
    accessToken: string;
}

export interface ConfirmEmailRequest {
    token: string;
}

export interface ConfirmEmailResponse {
    message: string;
}

export interface ResendConfirmationRequest {
    email: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface LogoutRequest {
    refreshToken: string;
}

export interface DevSwitchRequest {
    refreshToken: string;
    deviceInfo: string;
    ipAddress: string;
}

export interface FindByTokenRequest {
    accessToken: string;
}

// ─── User CRUD Messages ─────────────────────────────────────────────────────

export interface UserIdRequest {
    id: string;
}

export interface FindByEmailRequest {
    email: string;
}

export interface PaginationRequest {
    offset: number;
    limit: number;
}

export interface UpdateUserRequest {
    id: string;
    name: string;
    email: string;
    phone: string;
    password: string;
    addressId: string;
    currentPassword: string;
    preferencesJson: string;
}

export interface ChangePasswordRequest {
    id: string;
    oldPassword: string;
    newPassword: string;
}

export interface SetUserActiveRequest {
    id: string;
    isActive: boolean;
}

export interface AddRoleRequest {
    id: string;
    role: string;
}

export interface RemoveRoleRequest {
    id: string;
    role: string;
}

// ─── Invite Messages ─────────────────────────────────────────────────────────

export interface CreateInviteRequest {
    role: string;
    ttl: number;
    creatorId: string;
}

export interface InviteIdRequest {
    id: string;
}

export interface InviteTokenRequest {
    token: string;
}

export interface InviteLinkResponse {
    id: string;
    token: string;
    role: string;
    ttl: number;
    used: boolean;
    expiresAt: string;
    createdAt: string;
}

export interface InviteCreatedResponse {
    invite: InviteLinkResponse;
    link: string;
}

export interface InviteListResponse {
    invites: InviteLinkResponse[];
}

// ─── Shared Messages ─────────────────────────────────────────────────────────

export interface AuthUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    googleId: string;
    providers: string[];
    roles: string[];
    createdAt: string;
    updatedAt: string;
    preferencesJson: string;
    isActive: boolean;
}

export interface UserResponse {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    googleId: string;
    providers: string[];
    roles: string[];
    emailVerified: boolean;
    phoneVerified: boolean;
    createdAt: string;
    updatedAt: string;
    preferencesJson: string;
    isActive: boolean;
}

export interface PaginatedUsersResponse {
    data: UserResponse[];
    overallCount: number;
    offset: number;
    limit: number;
}

export interface EmptyRequest {}
export interface EmptyResponse {}

export interface AuthUserResponse {
    user: AuthUser;
}

// ─── Chat User Search ─────────────────────────────────────────────────────────

export interface SearchUsersForChatRequest {
    query: string;
    requesterId: string;
    requesterRoles: string[];
    limit: number;
}

export interface ChatUserResult {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}

export interface SearchUsersForChatResponse {
    users: ChatUserResult[];
}

// ─── gRPC Service Interface ─────────────────────────────────────────────────

export interface UserServiceClient {
    login(request: LoginRequest): Observable<AuthSessionResponse>;
    register(request: RegisterRequest): Observable<RegisterResponse>;
    confirmEmail(request: ConfirmEmailRequest): Observable<ConfirmEmailResponse>;
    resendConfirmation(request: ResendConfirmationRequest): Observable<EmptyResponse>;
    refreshAccessToken(request: RefreshTokenRequest): Observable<AccessTokenResponse>;
    logout(request: LogoutRequest): Observable<EmptyResponse>;
    devSwitchAccount(request: DevSwitchRequest): Observable<AuthSessionResponse>;
    findUserByAccessToken(request: FindByTokenRequest): Observable<AuthUserResponse>;

    findAllUsers(request: PaginationRequest): Observable<PaginatedUsersResponse>;
    findUserById(request: UserIdRequest): Observable<UserResponse>;
    findUserByEmail(request: FindByEmailRequest): Observable<UserResponse>;
    deleteUser(request: UserIdRequest): Observable<EmptyResponse>;
    updateUser(request: UpdateUserRequest): Observable<UserResponse>;
    changePassword(request: ChangePasswordRequest): Observable<UserResponse>;
    getProfile(request: UserIdRequest): Observable<UserResponse>;
    setEmailConfirmed(request: UserIdRequest): Observable<EmptyResponse>;
    addRole(request: AddRoleRequest): Observable<EmptyResponse>;
    removeRole(request: RemoveRoleRequest): Observable<EmptyResponse>;
    setUserActive(request: SetUserActiveRequest): Observable<EmptyResponse>;

    createInvite(request: CreateInviteRequest): Observable<InviteCreatedResponse>;
    findAllInvites(request: EmptyRequest): Observable<InviteListResponse>;
    checkInvite(request: InviteTokenRequest): Observable<InviteLinkResponse>;
    deleteInvite(request: InviteIdRequest): Observable<EmptyResponse>;

    searchUsersForChat(request: SearchUsersForChatRequest): Observable<SearchUsersForChatResponse>;
}
