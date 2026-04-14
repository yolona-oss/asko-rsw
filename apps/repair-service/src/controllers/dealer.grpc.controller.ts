import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { DealerService } from 'services/dealer.service';
import { AppError } from 'common/error';
import type { DealerProfile } from 'entities/dealer-profile.entity';
import type { DealerClient } from 'entities/dealer-client.entity';
import type { PointsTransaction } from 'entities/points-transaction.entity';
import type { PointsWithdrawal } from 'entities/points-withdrawal.entity';
import type { UserDevice } from 'entities/user-device.entity';

import type {
    CreateDealerProfileRequest,
    UpdateDealerProfileRequest,
    DealerGetByUserIdRequest,
    AddClientRequest,
    LinkClientRequest,
    AwardPointsRequest,
    DealerPointsHistoryRequest,
    RequestWithdrawalRequest,
    ProcessWithdrawalRequest,
    DealerPaginationRequest,
    DealerFindByIdRequest,
} from '@asko/proto';

function toGrpcError(error: unknown): RpcException {
    if (error instanceof AppError) {
        let grpcCode: number;
        switch (true) {
            case error.httpStatus === 400: grpcCode = status.INVALID_ARGUMENT; break;
            case error.httpStatus === 401: grpcCode = status.UNAUTHENTICATED; break;
            case error.httpStatus === 403: grpcCode = status.PERMISSION_DENIED; break;
            case error.httpStatus === 404: grpcCode = status.NOT_FOUND; break;
            case error.httpStatus === 409: grpcCode = status.ALREADY_EXISTS; break;
            default: grpcCode = status.INTERNAL; break;
        }
        return new RpcException({ code: grpcCode, message: error.message });
    }
    const msg = error instanceof Error ? error.message : 'Internal error';
    return new RpcException({ code: status.INTERNAL, message: msg });
}

function profileToRecord(entity: DealerProfile) {
    return {
        id: entity.id,
        userId: entity.userId,
        companyName: entity.companyName ?? '',
        inn: entity.inn ?? '',
        pointsBalance: entity.pointsBalance,
        createdAt: entity.createdAt?.toISOString() ?? '',
        updatedAt: entity.updatedAt?.toISOString() ?? '',
        agreementSignature: entity.agreementSignature ?? '',
        agreementSignedPayload: entity.agreementSignedPayload ?? '',
    };
}

function clientToRecord(entity: DealerClient) {
    const dealerId = typeof entity.dealer === 'object' ? entity.dealer.id : String(entity.dealer);
    return {
        id: entity.id,
        dealerId,
        clientUserId: entity.clientUserId,
        createdAt: entity.createdAt?.toISOString() ?? '',
    };
}

function transactionToRecord(entity: PointsTransaction) {
    const dealerId = typeof entity.dealer === 'object' ? entity.dealer.id : String(entity.dealer);
    const repairRequestId = entity.repairRequest
        ? (typeof entity.repairRequest === 'object' ? entity.repairRequest.id : String(entity.repairRequest))
        : '';
    return {
        id: entity.id,
        dealerId,
        type: entity.type,
        amount: entity.amount,
        reason: entity.reason,
        repairRequestId,
        createdAt: entity.createdAt?.toISOString() ?? '',
    };
}

function withdrawalToRecord(entity: PointsWithdrawal) {
    const dealerId = typeof entity.dealer === 'object' ? entity.dealer.id : String(entity.dealer);
    return {
        id: entity.id,
        dealerId,
        amount: entity.amount,
        status: entity.status,
        requestedAt: entity.requestedAt?.toISOString() ?? '',
        processedAt: entity.processedAt?.toISOString() ?? '',
        processedByUserId: entity.processedByUserId ?? '',
        cardNumber: entity.cardNumber ?? '',
        cardHolderName: entity.cardHolderName ?? '',
    };
}

function userDeviceToRecord(entity: UserDevice) {
    const device = typeof entity.device === 'object' ? entity.device : null;
    return {
        id: entity.id,
        userId: entity.userId,
        deviceId: device ? device.id : String(entity.device),
        serialNumber: entity.serialNumber,
        deviceName: device?.name ?? '',
        deviceModel: device?.model ?? '',
        deviceBrand: device?.brand ?? '',
    };
}

@Controller()
export class DealerGrpcController {
    constructor(
        private readonly dealerService: DealerService,
    ) {}

    @GrpcMethod('DealerService', 'CreateProfile')
    async createProfile(data: CreateDealerProfileRequest) {
        try {
            const profile = await this.dealerService.createProfile({
                userId: data.userId,
                companyName: data.companyName,
                inn: data.inn,
            });
            return { profile: profileToRecord(profile) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DealerService', 'UpdateProfile')
    async updateProfile(data: UpdateDealerProfileRequest) {
        try {
            const profile = await this.dealerService.updateProfile(data.userId, {
                companyName: data.companyName || undefined,
                inn: data.inn || undefined,
            });
            return { profile: profileToRecord(profile) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DealerService', 'GetProfile')
    async getProfile(data: DealerGetByUserIdRequest) {
        try {
            const profile = await this.dealerService.getProfile(data.userId);
            return { profile: profileToRecord(profile) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DealerService', 'AddClient')
    async addClient(data: AddClientRequest) {
        try {
            const client = await this.dealerService.addClient(data.dealerUserId, {
                clientUserId: data.clientUserId,
            });
            return { client: clientToRecord(client) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DealerService', 'LinkClientOnCertificateApproval')
    async linkClientOnCertificateApproval(data: LinkClientRequest) {
        try {
            await this.dealerService.linkClientOnCertificateApproval(data.dealerId, data.clientUserId);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DealerService', 'AwardPointsForCertificate')
    async awardPointsForCertificate(data: AwardPointsRequest) {
        try {
            await this.dealerService.awardPointsForCertificate(data.dealerId, data.certificatePrice, data.certificateNumber);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DealerService', 'GetClients')
    async getClients(data: DealerGetByUserIdRequest) {
        try {
            const clients = await this.dealerService.getClients(data.userId);
            return { clients: clients.map(clientToRecord) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DealerService', 'GetUserDevicesForCertificate')
    async getUserDevicesForCertificate(data: DealerGetByUserIdRequest) {
        try {
            const devices = await this.dealerService.getUserDevicesForCertificate(data.userId);
            return { devices: devices.map(userDeviceToRecord) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DealerService', 'GetPointsHistory')
    async getPointsHistory(data: DealerPointsHistoryRequest) {
        try {
            const result = await this.dealerService.getPointsHistory(data.userId, {
                page: data.page,
                limit: data.limit,
            });
            return {
                data: result.data.map(transactionToRecord),
                overallCount: result.total,
                page: data.page,
                limit: data.limit,
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DealerService', 'RequestWithdrawal')
    async requestWithdrawal(data: RequestWithdrawalRequest) {
        try {
            const withdrawal = await this.dealerService.requestWithdrawal(data.userId, {
                amount: data.amount,
                cardNumber: data.cardNumber,
                cardHolderName: data.cardHolderName,
            });
            return { withdrawal: withdrawalToRecord(withdrawal) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DealerService', 'ProcessWithdrawal')
    async processWithdrawal(data: ProcessWithdrawalRequest) {
        try {
            const withdrawal = await this.dealerService.processWithdrawal(
                data.withdrawalId,
                data.adminUserId,
                { status: data.status as any },
            );
            return { withdrawal: withdrawalToRecord(withdrawal) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DealerService', 'GetWithdrawals')
    async getWithdrawals(data: DealerGetByUserIdRequest) {
        try {
            const withdrawals = await this.dealerService.getWithdrawals(data.userId);
            return { withdrawals: withdrawals.map(withdrawalToRecord) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DealerService', 'GetAllWithdrawals')
    async getAllWithdrawals(data: DealerPaginationRequest) {
        try {
            const result = await this.dealerService.getAllWithdrawals({
                page: data.page,
                limit: data.limit,
            });
            return {
                data: result.data.map(withdrawalToRecord),
                overallCount: result.total,
                page: data.page,
                limit: data.limit,
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DealerService', 'GetWithdrawalForPayout')
    async getWithdrawalForPayout(data: DealerFindByIdRequest) {
        try {
            const result = await this.dealerService.getWithdrawalForPayout(data.id);
            return {
                amount: result.amount,
                dealerUserId: result.dealerUserId,
                cardNumber: result.cardNumber,
                cardHolderName: result.cardHolderName,
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DealerService', 'CompleteWithdrawal')
    async completeWithdrawal(data: DealerFindByIdRequest) {
        try {
            await this.dealerService.completeWithdrawal(data.id);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('DealerService', 'FindAllDealers')
    async findAllDealers(data: DealerPaginationRequest) {
        try {
            const result = await this.dealerService.findAll({
                page: data.page,
                limit: data.limit,
            });
            return {
                data: result.data.map(profileToRecord),
                overallCount: result.total,
                page: data.page,
                limit: data.limit,
            };
        } catch (e) { throw toGrpcError(e); }
    }
}
