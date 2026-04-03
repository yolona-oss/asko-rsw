import { Observable } from 'rxjs';

// ─── Auth Messages ───────────────────────────────────────────────────────────

export interface LoginRequest {
    email: string;
    password: string;
    phone: string;
    googleId: string;
    deviceInfo: string;
    ipAddress: string;
    trustedDeviceToken: string;
}

export interface LoginResponse {
    status: string;
    accessToken: string;
    refreshToken: string;
    user?: AuthUser;
    mfaToken: string;
    mfaMethod: string;
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
    middleName: string;
}

export interface RegisterResponse {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
    roles: string[];
    status: string;
    pendingToken: string;
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

export interface ResendConfirmationResponse {
    retryAfter: number;
}

export interface RequestEmailChangeRequest {
    id: string;
    newEmail: string;
}

export interface RequestEmailChangeResponse {
    message: string;
    retryAfter: number;
}

export interface ConfirmEmailChangeRequest {
    token: string;
}

export interface ConfirmEmailChangeResponse {
    message: string;
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
    page: number;
    limit: number;
}

export interface FindAllUsersRequest {
    page: number;
    limit: number;
    search: string;
    role: string;
    status: string;
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
    middleName: string;
}

export interface ChangePasswordRequest {
    id: string;
    oldPassword: string;
    newPassword: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ForgotPasswordResponse {
    message: string;
    retryAfter: number;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}

export interface ResetPasswordResponse {
    message: string;
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
    middleName: string;
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
    middleName: string;
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
    page: number;
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
    middleName: string;
    email: string;
}

export interface SearchUsersForChatResponse {
    users: ChatUserResult[];
}

// ─── MFA Messages ───────────────────────────────────────────────────────────

export interface VerifyMfaRequest {
    mfaToken: string;
    code: string;
    trustDevice: boolean;
    deviceInfo: string;
    ipAddress: string;
}

export interface VerifyMfaResponse {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
    trustedDeviceToken: string;
}

export interface ResendMfaOtpRequest {
    mfaToken: string;
}

export interface ResendMfaOtpResponse {
    retryAfter: number;
}

export interface EnableMfaRequest {
    userId: string;
}

export interface EnableMfaResponse {
    message: string;
    retryAfter: number;
}

export interface VerifyEnableMfaRequest {
    userId: string;
    code: string;
}

export interface VerifyEnableMfaResponse {
    message: string;
}

export interface InitiateDisableMfaRequest {
    userId: string;
}

export interface InitiateDisableMfaResponse {
    message: string;
    retryAfter: number;
}

export interface ConfirmDisableMfaRequest {
    userId: string;
    code: string;
}

export interface ConfirmDisableMfaResponse {
    message: string;
}

export interface GetMfaStatusRequest {
    userId: string;
}

export interface GetMfaStatusResponse {
    enabled: boolean;
    methods: string[];
}

// ─── Phone Register Messages ────────────────────────────────────────────────

export interface VerifyPhoneRegisterRequest {
    pendingToken: string;
    code: string;
    deviceInfo: string;
    ipAddress: string;
}

export interface ResendPhoneRegisterOtpRequest {
    pendingToken: string;
}

export interface ResendPhoneRegisterOtpResponse {
    retryAfter: number;
}

// ─── Phone Verification Messages ────────────────────────────────────────────

export interface SendPhoneVerificationRequest {
    userId: string;
}

export interface SendPhoneVerificationResponse {
    message: string;
    retryAfter: number;
}

export interface ConfirmPhoneVerificationRequest {
    userId: string;
    code: string;
}

export interface ConfirmPhoneVerificationResponse {
    message: string;
}

// ─── Phone Change Messages ──────────────────────────────────────────────────

export interface RequestPhoneChangeRequest {
    userId: string;
    newPhone: string;
}

export interface RequestPhoneChangeResponse {
    message: string;
    retryAfter: number;
}

export interface ConfirmPhoneChangeRequest {
    userId: string;
    code: string;
}

export interface ConfirmPhoneChangeResponse {
    message: string;
}

// ─── gRPC Service Interface ─────────────────────────────────────────────────

export interface UserServiceClient {
    login(request: LoginRequest): Observable<LoginResponse>;
    register(request: RegisterRequest): Observable<RegisterResponse>;
    confirmEmail(request: ConfirmEmailRequest): Observable<ConfirmEmailResponse>;
    resendConfirmation(request: ResendConfirmationRequest): Observable<ResendConfirmationResponse>;
    refreshAccessToken(request: RefreshTokenRequest): Observable<AccessTokenResponse>;
    logout(request: LogoutRequest): Observable<EmptyResponse>;
    devSwitchAccount(request: DevSwitchRequest): Observable<AuthSessionResponse>;
    findUserByAccessToken(request: FindByTokenRequest): Observable<AuthUserResponse>;
    forgotPassword(request: ForgotPasswordRequest): Observable<ForgotPasswordResponse>;
    resetPassword(request: ResetPasswordRequest): Observable<ResetPasswordResponse>;
    requestEmailChange(request: RequestEmailChangeRequest): Observable<RequestEmailChangeResponse>;
    confirmEmailChange(request: ConfirmEmailChangeRequest): Observable<ConfirmEmailChangeResponse>;

    // MFA
    verifyMfaOtp(request: VerifyMfaRequest): Observable<VerifyMfaResponse>;
    resendMfaOtp(request: ResendMfaOtpRequest): Observable<ResendMfaOtpResponse>;
    enableMfa(request: EnableMfaRequest): Observable<EnableMfaResponse>;
    verifyEnableMfa(request: VerifyEnableMfaRequest): Observable<VerifyEnableMfaResponse>;
    initiateDisableMfa(request: InitiateDisableMfaRequest): Observable<InitiateDisableMfaResponse>;
    confirmDisableMfa(request: ConfirmDisableMfaRequest): Observable<ConfirmDisableMfaResponse>;
    getMfaStatus(request: GetMfaStatusRequest): Observable<GetMfaStatusResponse>;

    // Phone register
    verifyPhoneRegister(request: VerifyPhoneRegisterRequest): Observable<RegisterResponse>;
    resendPhoneRegisterOtp(request: ResendPhoneRegisterOtpRequest): Observable<ResendPhoneRegisterOtpResponse>;

    // Phone verification
    sendPhoneVerification(request: SendPhoneVerificationRequest): Observable<SendPhoneVerificationResponse>;
    confirmPhoneVerification(request: ConfirmPhoneVerificationRequest): Observable<ConfirmPhoneVerificationResponse>;

    // Phone change
    requestPhoneChange(request: RequestPhoneChangeRequest): Observable<RequestPhoneChangeResponse>;
    confirmPhoneChange(request: ConfirmPhoneChangeRequest): Observable<ConfirmPhoneChangeResponse>;

    findAllUsers(request: FindAllUsersRequest): Observable<PaginatedUsersResponse>;
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
