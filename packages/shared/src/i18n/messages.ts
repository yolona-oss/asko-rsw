/**
 * Centralised message-key registry.
 *
 * Every user-facing string (error, success, validation hint) gets a key here.
 * Keys are grouped by domain as a nested const object; leaf values are
 * dot-notation strings used as lookup keys in translation catalogs.
 *
 * Interpolation placeholders use `{paramName}` syntax:
 *   t(msg.auth.waitCooldown, 'ru', { seconds: 30 }) → 'Подождите 30 сек.'
 */
export const msg = {
    // ── Common / generic ──────────────────────────────────────────────────
    common: {
        badRequest: 'common.badRequest',
        unauthorized: 'common.unauthorized',
        forbidden: 'common.forbidden',
        notFound: 'common.notFound',
        conflict: 'common.conflict',
        internalError: 'common.internalError',
        entityNotFound: 'common.entityNotFound',
        entityExists: 'common.entityExists',
        invalidData: 'common.invalidData',
        validationError: 'common.validationError',
        dbCannotRead: 'common.dbCannotRead',
        dbCannotCreate: 'common.dbCannotCreate',
        dbCannotUpdate: 'common.dbCannotUpdate',
        dbCannotDelete: 'common.dbCannotDelete',
        dbDuplicateKey: 'common.dbDuplicateKey',
        dbIncorrectModel: 'common.dbIncorrectModel',
    },

    // ── Auth ──────────────────────────────────────────────────────────────
    auth: {
        // errors
        userNotFound: 'auth.userNotFound',
        userNotFoundByPhone: 'auth.userNotFoundByPhone',
        invalidCredentials: 'auth.invalidCredentials',
        tokenNotFound: 'auth.tokenNotFound',
        tokenValidationFailed: 'auth.tokenValidationFailed',
        tokenExpired: 'auth.tokenExpired',
        tokenInvalid: 'auth.tokenInvalid',
        accountDisabled: 'auth.accountDisabled',
        accountLocked: 'auth.accountLocked',
        noLoginMethod: 'auth.noLoginMethod',
        noRegistrationMethod: 'auth.noRegistrationMethod',
        phoneAlreadyRegistered: 'auth.phoneAlreadyRegistered',
        waitCooldown: 'auth.waitCooldown',
        noEmail: 'auth.noEmail',
        emailAlreadyConfirmed: 'auth.emailAlreadyConfirmed',
        refreshTokenNotFound: 'auth.refreshTokenNotFound',
        refreshTokenInvalid: 'auth.refreshTokenInvalid',
        resetTokenInvalid: 'auth.resetTokenInvalid',
        resetTokenExpired: 'auth.resetTokenExpired',
        resetTokenGenerationFailed: 'auth.resetTokenGenerationFailed',
        emailNotConfirmedEditDirectly: 'auth.emailNotConfirmedEditDirectly',
        emailSameAsCurrent: 'auth.emailSameAsCurrent',
        emailAlreadyUsed: 'auth.emailAlreadyUsed',
        emailChangeTokenInvalid: 'auth.emailChangeTokenInvalid',
        emailAlreadyUsedByOther: 'auth.emailAlreadyUsedByOther',
        emailChangeTokenExpired: 'auth.emailChangeTokenExpired',
        invalidCode: 'auth.invalidCode',
        registrationTokenExpired: 'auth.registrationTokenExpired',
        registrationDataExpired: 'auth.registrationDataExpired',
        phoneNotSet: 'auth.phoneNotSet',
        phoneAlreadyVerified: 'auth.phoneAlreadyVerified',
        phoneNotVerifiedEditDirectly: 'auth.phoneNotVerifiedEditDirectly',
        phoneSameAsCurrent: 'auth.phoneSameAsCurrent',
        phoneAlreadyUsed: 'auth.phoneAlreadyUsed',
        phoneChangeRequestExpired: 'auth.phoneChangeRequestExpired',
        phoneAlreadyUsedByOther: 'auth.phoneAlreadyUsedByOther',
        sessionNotFound: 'auth.sessionNotFound',
        oauthAccountLinkedToOther: 'auth.oauthAccountLinkedToOther',
        cannotUnlinkLastLogin: 'auth.cannotUnlinkLastLogin',
        tokenExchangeFailed: 'auth.tokenExchangeFailed',
        profileFetchFailed: 'auth.profileFetchFailed',
        // success / info
        emailAlreadySent: 'auth.emailAlreadySent',
        emailSentIfAccountExists: 'auth.emailSentIfAccountExists',
        passwordChanged: 'auth.passwordChanged',
        emailConfirmationSent: 'auth.emailConfirmationSent',
        emailChanged: 'auth.emailChanged',
        codeSent: 'auth.codeSent',
        codeAlreadySent: 'auth.codeAlreadySent',
        codeSentToEmail: 'auth.codeSentToEmail',
        codeSentToNewPhone: 'auth.codeSentToNewPhone',
        phoneVerified: 'auth.phoneVerified',
        phoneChanged: 'auth.phoneChanged',
        sessionTerminated: 'auth.sessionTerminated',
        invitationDeleted: 'auth.invitationDeleted',
        oauthUnlinked: 'auth.oauthUnlinked',
        emailSentSuccessfully: 'auth.emailSentSuccessfully',
    },

    // ── MFA ───────────────────────────────────────────────────────────────
    mfa: {
        tokenInvalid: 'mfa.tokenInvalid',
        requireEmailConfirmation: 'mfa.requireEmailConfirmation',
        alreadyEnabled: 'mfa.alreadyEnabled',
        invalidCode: 'mfa.invalidCode',
        notEnabled: 'mfa.notEnabled',
        codeAlreadySent: 'mfa.codeAlreadySent',
        codeSentToEmail: 'mfa.codeSentToEmail',
        enabled: 'mfa.enabled',
        disabled: 'mfa.disabled',
    },

    // ── OTP ───────────────────────────────────────────────────────────────
    otp: {
        tooManyAttempts: 'otp.tooManyAttempts',
    },

    // ── Repair requests ──────────────────────────────────────────────────
    repair: {
        notFound: 'repair.notFound',
        activeExists: 'repair.activeExists',
        avrLocked: 'repair.avrLocked',
        mustSetPrice: 'repair.mustSetPrice',
        mustBeInProgressStatus: 'repair.mustBeInProgressStatus',
        cannotReassignAvrExists: 'repair.cannotReassignAvrExists',
        cannotTransferNoRepairer: 'repair.cannotTransferNoRepairer',
        cannotTransferToSelf: 'repair.cannotTransferToSelf',
        repairerNotActive: 'repair.repairerNotActive',
        repairerLimitReached: 'repair.repairerLimitReached',
        onlyAcceptCompleted: 'repair.onlyAcceptCompleted',
        alreadyAccepted: 'repair.alreadyAccepted',
        priceOnlyInProgress: 'repair.priceOnlyInProgress',
        avrRequiresSteps: 'repair.avrRequiresSteps',
        avrRequiresPrice: 'repair.avrRequiresPrice',
        avrAlreadySignedOrNotGenerated: 'repair.avrAlreadySignedOrNotGenerated',
        avrNotGenerated: 'repair.avrNotGenerated',
        avrMustBeGeneratedBeforeSigning: 'repair.avrMustBeGeneratedBeforeSigning',
        avrOnlyOwnerCanSign: 'repair.avrOnlyOwnerCanSign',
        avrNotReadyForSigning: 'repair.avrNotReadyForSigning',
        certificateNotBelongsToDevice: 'repair.certificateNotBelongsToDevice',
        userDeviceNotFound: 'repair.userDeviceNotFound',
    },

    // ── Work steps ───────────────────────────────────────────────────────
    workStep: {
        notFound: 'workStep.notFound',
        locked: 'workStep.locked',
        cannotAddInStatus: 'workStep.cannotAddInStatus',
        mandatoryCannotDelete: 'workStep.mandatoryCannotDelete',
        onlyInProgressStatus: 'workStep.onlyInProgressStatus',
        cannotRenameMandatory: 'workStep.cannotRenameMandatory',
        cannotSkipLast: 'workStep.cannotSkipLast',
        lockedStatusOnly: 'workStep.lockedStatusOnly',
        cannotConfirmInFinalStatus: 'workStep.cannotConfirmInFinalStatus',
        noMandatoryStepsToConfirm: 'workStep.noMandatoryStepsToConfirm',
        cannotRejectInFinalStatus: 'workStep.cannotRejectInFinalStatus',
        noMandatoryStepsToReject: 'workStep.noMandatoryStepsToReject',
        alreadyLocked: 'workStep.alreadyLocked',
        minStepsToLock: 'workStep.minStepsToLock',
    },

    // ── Broken parts ─────────────────────────────────────────────────────
    brokenPart: {
        notFound: 'brokenPart.notFound',
        noAccess: 'brokenPart.noAccess',
        cannotModifyCompleted: 'brokenPart.cannotModifyCompleted',
        mustSpecifyName: 'brokenPart.mustSpecifyName',
        mustSelectFromCatalog: 'brokenPart.mustSelectFromCatalog',
        cannotOrderCompleted: 'brokenPart.cannotOrderCompleted',
        alreadyOrdered: 'brokenPart.alreadyOrdered',
    },

    // ── Repairer ─────────────────────────────────────────────────────────
    repairer: {
        notFound: 'repairer.notFound',
        profileNotFound: 'repairer.profileNotFound',
        profileAlreadyExists: 'repairer.profileAlreadyExists',
    },

    // ── Review ───────────────────────────────────────────────────────────
    review: {
        notFound: 'review.notFound',
        onlyForCompleted: 'review.onlyForCompleted',
        onlyOwner: 'review.onlyOwner',
        noRepairer: 'review.noRepairer',
        alreadyExists: 'review.alreadyExists',
        ratingRange: 'review.ratingRange',
    },

    // ── Dealer ───────────────────────────────────────────────────────────
    dealer: {
        profileNotFound: 'dealer.profileNotFound',
        profileAlreadyExists: 'dealer.profileAlreadyExists',
        clientAlreadyLinked: 'dealer.clientAlreadyLinked',
        withdrawalNotFound: 'dealer.withdrawalNotFound',
        withdrawalAlreadyProcessed: 'dealer.withdrawalAlreadyProcessed',
        withdrawalInvalidStatus: 'dealer.withdrawalInvalidStatus',
        withdrawalNotApproved: 'dealer.withdrawalNotApproved',
        insufficientPoints: 'dealer.insufficientPoints',
        withdrawalAmountPositive: 'dealer.withdrawalAmountPositive',
    },

    // ── Schedule ─────────────────────────────────────────────────────────
    schedule: {
        dayOff: 'schedule.dayOff',
        notStarted: 'schedule.notStarted',
        dayEnded: 'schedule.dayEnded',
        onLeave: 'schedule.onLeave',
        overtimeLimit: 'schedule.overtimeLimit',
        notEnoughTime: 'schedule.notEnoughTime',
        overtimeOverlap: 'schedule.overtimeOverlap',
        repairerDayOff: 'schedule.repairerDayOff',
    },

    // ── Validation (address / device) ────────────────────────────────────
    validation: {
        addressNotFound: 'validation.addressNotFound',
        coordsOutOfBounds: 'validation.coordsOutOfBounds',
        coordsMismatch: 'validation.coordsMismatch',
        deviceDuplicate: 'validation.deviceDuplicate',
        deviceSerialFailed: 'validation.deviceSerialFailed',
        entityInvalid: 'validation.entityInvalid',
        entityCheckFailed: 'validation.entityCheckFailed',
        entityPending: 'validation.entityPending',
    },

    // ── Access / policies ────────────────────────────────────────────────
    access: {
        userIdRequired: 'access.userIdRequired',
        noAccessToOtherUser: 'access.noAccessToOtherUser',
        noAccessToRequest: 'access.noAccessToRequest',
        requestNotFound: 'access.requestNotFound',
        otherManagerOwns: 'access.otherManagerOwns',
        partNotFound: 'access.partNotFound',
        noAccessToSchedule: 'access.noAccessToSchedule',
    },

    // ── Payment ──────────────────────────────────────────────────────────
    payment: {
        notFound: 'payment.notFound',
        invalidStatusTransition: 'payment.invalidStatusTransition',
        invalidAmount: 'payment.invalidAmount',
        amountPositive: 'payment.amountPositive',
        amountTooLarge: 'payment.amountTooLarge',
        amountTooManyDecimals: 'payment.amountTooManyDecimals',
        alreadyProcessing: 'payment.alreadyProcessing',
        noPending: 'payment.noPending',
        notBelongsToUser: 'payment.notBelongsToUser',
        cashNotAllowedCerts: 'payment.cashNotAllowedCerts',
        unknownProvider: 'payment.unknownProvider',
        invalidWebhookSignature: 'payment.invalidWebhookSignature',
        amountMismatch: 'payment.amountMismatch',
        refundRange: 'payment.refundRange',
        onlyCashCanConfirm: 'payment.onlyCashCanConfirm',
        notPending: 'payment.notPending',
    },

    // ── Certificate ──────────────────────────────────────────────────────
    certificate: {
        notFound: 'certificate.notFound',
        numberExists: 'certificate.numberExists',
        notPendingPayment: 'certificate.notPendingPayment',
        cannotReapplyRevoked: 'certificate.cannotReapplyRevoked',
        reapplyWindowExpired: 'certificate.reapplyWindowExpired',
        noDevice: 'certificate.noDevice',
        pendingExists: 'certificate.pendingExists',
        alreadyRevoked: 'certificate.alreadyRevoked',
        onlyActiveReassign: 'certificate.onlyActiveReassign',
    },

    // ── Device ───────────────────────────────────────────────────────────
    device: {
        notFound: 'device.notFound',
        categoryNotFound: 'device.categoryNotFound',
        partNotFound: 'device.partNotFound',
        cannotDeleteWithDevices: 'device.cannotDeleteWithDevices',
        unknownCategory: 'device.unknownCategory',
        deleted: 'device.deleted',
        categoryDeleted: 'device.categoryDeleted',
        partDeleted: 'device.partDeleted',
        removedFromAccount: 'device.removedFromAccount',
    },

    // ── Address ──────────────────────────────────────────────────────────
    address: {
        notFound: 'address.notFound',
    },

    // ── Chat ─────────────────────────────────────────────────────────────
    chat: {
        conversationNotFound: 'chat.conversationNotFound',
        conversationClosed: 'chat.conversationClosed',
        messageNotFound: 'chat.messageNotFound',
        participantNotFound: 'chat.participantNotFound',
        alreadyParticipant: 'chat.alreadyParticipant',
        notParticipant: 'chat.notParticipant',
        cannotDeleteConversation: 'chat.cannotDeleteConversation',
        directConversationExists: 'chat.directConversationExists',
        directRequiresOneParticipant: 'chat.directRequiresOneParticipant',
        editOwnOnly: 'chat.editOwnOnly',
        deleteOwnOnly: 'chat.deleteOwnOnly',
    },

    // ── File / upload ────────────────────────────────────────────────────
    file: {
        imageNotFound: 'file.imageNotFound',
        imageNotAttached: 'file.imageNotAttached',
        videoNotFound: 'file.videoNotFound',
        documentNotFound: 'file.documentNotFound',
        unsupportedMimeType: 'file.unsupportedMimeType',
        exceedsMaxSize: 'file.exceedsMaxSize',
        onlyOneFile: 'file.onlyOneFile',
        noFilePart: 'file.noFilePart',
        missingUploadStart: 'file.missingUploadStart',
        uploadFailed: 'file.uploadFailed',
    },

    // ── Article / content ────────────────────────────────────────────────
    article: {
        notFound: 'article.notFound',
    },

    // ── Notification ─────────────────────────────────────────────────────
    notification: {
        notFound: 'notification.notFound',
    },
} as const;

// ── Type extraction ──────────────────────────────────────────────────────

/** Recursively extract all leaf string literal types from a nested const object. */
type LeafValues<T> = T extends string ? T : { [K in keyof T]: LeafValues<T[K]> }[keyof T];

/** Union of all message key string values. */
export type MsgKey = LeafValues<typeof msg>;

/** Set of all valid MsgKey values — for runtime checks. */
const allKeys = new Set<string>();
(function collect(obj: Record<string, unknown>) {
    for (const v of Object.values(obj)) {
        if (typeof v === 'string') allKeys.add(v);
        else if (typeof v === 'object' && v !== null) collect(v as Record<string, unknown>);
    }
})(msg);

/** Runtime check whether a string is a valid MsgKey. */
export function isMsgKey(value: string): value is MsgKey {
    return allKeys.has(value);
}
