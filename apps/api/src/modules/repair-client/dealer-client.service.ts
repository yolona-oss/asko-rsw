import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcCall } from 'common/grpc';

import type {
    DealerServiceClient,
    DealerProfileResponse,
    DealerClientResponse,
    DealerClientListResponse,
    DealerUserDeviceListResponse,
    PaginatedPointsResponse,
    WithdrawalResponse,
    WithdrawalListResponse,
    PaginatedWithdrawalsResponse,
    WithdrawalPayoutResponse,
    PaginatedDealersResponse,
    DealerEmptyResponse,
} from '@asko/proto';

@Injectable()
export class DealerClientService implements OnModuleInit {
    private dealerService!: DealerServiceClient;

    constructor(
        @Inject('REPAIR_PACKAGE') private readonly client: ClientGrpc,
    ) {}

    onModuleInit() {
        this.dealerService = this.client.getService<DealerServiceClient>('DealerService');
    }

    // ── Profile ──

    createProfile(userId: string, dto: { companyName?: string; inn?: string }): Promise<DealerProfileResponse> {
        return grpcCall(this.dealerService.createProfile({
            userId,
            companyName: dto.companyName ?? '',
            inn: dto.inn ?? '',
        }));
    }

    updateProfile(userId: string, dto: { companyName?: string; inn?: string }): Promise<DealerProfileResponse> {
        return grpcCall(this.dealerService.updateProfile({
            userId,
            companyName: dto.companyName ?? '',
            inn: dto.inn ?? '',
        }));
    }

    getProfile(userId: string): Promise<DealerProfileResponse> {
        return grpcCall(this.dealerService.getProfile({ userId }));
    }

    // ── Clients ──

    addClient(dealerUserId: string, clientUserId: string): Promise<DealerClientResponse> {
        return grpcCall(this.dealerService.addClient({ dealerUserId, clientUserId }));
    }

    linkClientOnCertificateApproval(dealerId: string, clientUserId: string): Promise<DealerEmptyResponse> {
        return grpcCall(this.dealerService.linkClientOnCertificateApproval({ dealerId, clientUserId }));
    }

    getClients(userId: string): Promise<DealerClientListResponse> {
        return grpcCall(this.dealerService.getClients({ userId }));
    }

    // ── Points ──

    awardPointsForCertificate(dealerId: string, certificatePrice: number, certificateNumber: string): Promise<DealerEmptyResponse> {
        return grpcCall(this.dealerService.awardPointsForCertificate({ dealerId, certificatePrice, certificateNumber }));
    }

    getPointsHistory(userId: string, pagination: { page?: number; limit?: number }): Promise<PaginatedPointsResponse> {
        return grpcCall(this.dealerService.getPointsHistory({
            userId,
            page: pagination.page ?? 1,
            limit: pagination.limit ?? 20,
        }));
    }

    // ── Devices ──

    getUserDevicesForCertificate(userId: string): Promise<DealerUserDeviceListResponse> {
        return grpcCall(this.dealerService.getUserDevicesForCertificate({ userId }));
    }

    // ── Withdrawals ──

    requestWithdrawal(userId: string, amount: number): Promise<WithdrawalResponse> {
        return grpcCall(this.dealerService.requestWithdrawal({ userId, amount }));
    }

    processWithdrawal(withdrawalId: string, adminUserId: string, status: string): Promise<WithdrawalResponse> {
        return grpcCall(this.dealerService.processWithdrawal({ withdrawalId, adminUserId, status }));
    }

    getWithdrawals(userId: string): Promise<WithdrawalListResponse> {
        return grpcCall(this.dealerService.getWithdrawals({ userId }));
    }

    getAllWithdrawals(pagination: { page?: number; limit?: number; search?: string }): Promise<PaginatedWithdrawalsResponse> {
        return grpcCall(this.dealerService.getAllWithdrawals({
            page: pagination.page ?? 1,
            limit: pagination.limit ?? 20,
            search: pagination.search ?? '',
        }));
    }

    getWithdrawalForPayout(id: string): Promise<WithdrawalPayoutResponse> {
        return grpcCall(this.dealerService.getWithdrawalForPayout({ id }));
    }

    completeWithdrawal(id: string): Promise<DealerEmptyResponse> {
        return grpcCall(this.dealerService.completeWithdrawal({ id }));
    }

    // ── Queries ──

    findAllDealers(pagination: { page?: number; limit?: number; search?: string }): Promise<PaginatedDealersResponse> {
        return grpcCall(this.dealerService.findAllDealers({
            page: pagination.page ?? 1,
            limit: pagination.limit ?? 20,
            search: pagination.search ?? '',
        }));
    }
}
