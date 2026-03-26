import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { DealerProfile } from 'entities/dealer-profile.entity';
import { DealerClient } from 'entities/dealer-client.entity';
import { PointsTransaction } from 'entities/points-transaction.entity';
import { PointsWithdrawal } from 'entities/points-withdrawal.entity';
import { UserDevice } from 'entities/user-device.entity';
import {
    CreateDealerProfileDto,
    UpdateDealerProfileDto,
    AddDealerClientDto,
    RequestPointsWithdrawalDto,
    ProcessWithdrawalDto,
    PointsTransactionType,
    WithdrawalStatus,
    PaginationDto,
} from '@asko/shared';
import { AppErrors } from 'common/error';

/** Points = certificatePrice * 0.03, rounded to nearest integer */
function calculateDealerPoints(certificatePrice: number): number {
    return Math.round(certificatePrice * 0.03);
}

@Injectable()
export class DealerService {
    constructor(private readonly em: EntityManager) {}

    /** Admin creates dealer profile for a user */
    @CreateRequestContext()
    async createProfile(dto: CreateDealerProfileDto): Promise<DealerProfile> {
        // User entity is in user-service DB - we only store userId reference
        const existing = await this.em.findOne(DealerProfile, { userId: dto.userId });
        if (existing) throw AppErrors.dbEntityExists('Dealer profile already exists');

        const profile = this.em.create(DealerProfile, {
            userId: dto.userId,
            companyName: dto.companyName,
            inn: dto.inn,
        });
        await this.em.persistAndFlush(profile);
        return profile;
    }

    /** Dealer updates own profile */
    @CreateRequestContext()
    async updateProfile(dealerUserId: string, dto: UpdateDealerProfileDto): Promise<DealerProfile> {
        const profile = await this.em.findOne(DealerProfile, { userId: dealerUserId });
        if (!profile) throw AppErrors.dbEntityNotFound('Dealer profile not found');
        this.em.assign(profile, dto);
        await this.em.flush();
        return profile;
    }

    /** Get dealer profile */
    @CreateRequestContext()
    async getProfile(dealerUserId: string): Promise<DealerProfile> {
        const profile = await this.em.findOne(DealerProfile, { userId: dealerUserId }, { populate: ['clients'] });
        if (!profile) throw AppErrors.dbEntityNotFound('Dealer profile not found');
        return profile;
    }

    /** Dealer adds a client (by clientUserId string) */
    @CreateRequestContext()
    async addClient(dealerUserId: string, dto: AddDealerClientDto): Promise<DealerClient> {
        const dealer = await this.em.findOne(DealerProfile, { userId: dealerUserId });
        if (!dealer) throw AppErrors.dbEntityNotFound('Dealer profile not found');

        const existing = await this.em.findOne(DealerClient, { dealer: dealer.id, clientUserId: dto.clientUserId });
        if (existing) throw AppErrors.dbEntityExists('Client already linked');

        const client = this.em.create(DealerClient, {
            dealer,
            clientUserId: dto.clientUserId,
        });
        await this.em.persistAndFlush(client);
        return client;
    }

    /** Auto-link client when certificate is approved (called from internal orchestration) */
    @CreateRequestContext()
    async linkClientOnCertificateApproval(dealerId: string, clientUserId: string): Promise<void> {
        if (!dealerId) return;

        const existing = await this.em.findOne(DealerClient, { dealer: dealerId, clientUserId });
        if (!existing) {
            const client = this.em.create(DealerClient, {
                dealer: dealerId,
                clientUserId,
            });
            await this.em.persist(client);
            await this.em.flush();
        }
    }

    /** Award points to dealer when certificate approved. Points = certificatePrice * 0.03 */
    @CreateRequestContext()
    async awardPointsForCertificate(dealerId: string, certificatePrice: number, certificateNumber: string): Promise<void> {
        if (!dealerId) return;

        const dealer = await this.em.findOne(DealerProfile, { id: dealerId });
        if (!dealer) return;

        const points = calculateDealerPoints(certificatePrice);
        if (points <= 0) return;

        dealer.pointsBalance += points;

        const transaction = this.em.create(PointsTransaction, {
            dealer,
            type: PointsTransactionType.EARNED,
            amount: points,
            reason: `Certificate ${certificateNumber} approved (price: ${certificatePrice})`,
        });
        await this.em.persist(transaction);
        await this.em.flush();
    }

    /** Dealer gets client list */
    @CreateRequestContext()
    async getClients(dealerUserId: string): Promise<DealerClient[]> {
        const dealer = await this.em.findOne(DealerProfile, { userId: dealerUserId });
        if (!dealer) throw AppErrors.dbEntityNotFound('Dealer profile not found');
        return this.em.find(DealerClient, { dealer: dealer.id });
    }

    /**
     * Get a user's devices for certificate wizard.
     * UserDevice is in the same DB, so query directly instead of gRPC.
     */
    @CreateRequestContext()
    async getUserDevicesForCertificate(userId: string): Promise<UserDevice[]> {
        return this.em.find(UserDevice, { userId }, {
            populate: ['device', 'address'],
            orderBy: { createdAt: 'DESC' },
        });
    }

    /** Dealer gets points history */
    @CreateRequestContext()
    async getPointsHistory(dealerUserId: string, pagination: PaginationDto): Promise<{ data: PointsTransaction[]; total: number }> {
        const dealer = await this.em.findOne(DealerProfile, { userId: dealerUserId });
        if (!dealer) throw AppErrors.dbEntityNotFound('Dealer profile not found');

        const [data, total] = await this.em.findAndCount(
            PointsTransaction,
            { dealer: dealer.id },
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.offset ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: { createdAt: 'DESC' },
            }
        );
        return { data, total };
    }

    /** Dealer requests points withdrawal */
    @CreateRequestContext()
    async requestWithdrawal(dealerUserId: string, dto: RequestPointsWithdrawalDto): Promise<PointsWithdrawal> {
        const dealer = await this.em.findOne(DealerProfile, { userId: dealerUserId });
        if (!dealer) throw AppErrors.dbEntityNotFound('Dealer profile not found');

        if (dealer.pointsBalance < dto.amount) {
            throw AppErrors.badRequest('Insufficient points balance');
        }

        const withdrawal = this.em.create(PointsWithdrawal, {
            dealer,
            amount: dto.amount,
            status: WithdrawalStatus.PENDING,
        });

        // Deduct points immediately (hold)
        dealer.pointsBalance -= dto.amount;

        const transaction = this.em.create(PointsTransaction, {
            dealer,
            type: PointsTransactionType.SPENT,
            amount: -dto.amount,
            reason: 'Points withdrawal request',
        });

        await this.em.persist(transaction);
        await this.em.persistAndFlush(withdrawal);
        return withdrawal;
    }

    /** Admin processes withdrawal */
    @CreateRequestContext()
    async processWithdrawal(withdrawalId: string, adminUserId: string, dto: ProcessWithdrawalDto): Promise<PointsWithdrawal> {
        const withdrawal = await this.em.findOne(PointsWithdrawal, { id: withdrawalId }, { populate: ['dealer'] });
        if (!withdrawal) throw AppErrors.dbEntityNotFound('Withdrawal not found');
        if (withdrawal.status !== WithdrawalStatus.PENDING) {
            throw AppErrors.badRequest('Withdrawal already processed');
        }

        withdrawal.status = dto.status;
        withdrawal.processedAt = new Date();
        withdrawal.processedByUserId = adminUserId;

        // If rejected, refund points
        if (dto.status === WithdrawalStatus.REJECTED) {
            const dealer = withdrawal.dealer;
            dealer.pointsBalance += withdrawal.amount;

            const transaction = this.em.create(PointsTransaction, {
                dealer,
                type: PointsTransactionType.ADJUSTMENT,
                amount: withdrawal.amount,
                reason: 'Withdrawal rejected - points refunded',
            });
            await this.em.persist(transaction);
        }

        await this.em.flush();
        return withdrawal;
    }

    /** Get withdrawal details for payout processing via payment-service */
    @CreateRequestContext()
    async getWithdrawalForPayout(withdrawalId: string): Promise<{ amount: number; dealerUserId: string }> {
        const withdrawal = await this.em.findOne(PointsWithdrawal, { id: withdrawalId }, { populate: ['dealer'] });
        if (!withdrawal) throw AppErrors.dbEntityNotFound('Withdrawal not found');
        return {
            amount: withdrawal.amount,
            dealerUserId: withdrawal.dealer.userId,
        };
    }

    /** Called by PaymentService handler when payout is processed */
    @CreateRequestContext()
    async completeWithdrawal(withdrawalId: string): Promise<void> {
        const withdrawal = await this.em.findOne(PointsWithdrawal, { id: withdrawalId });
        if (!withdrawal) return;
        withdrawal.status = WithdrawalStatus.COMPLETED;
        withdrawal.processedAt = new Date();
        await this.em.flush();
    }

    /** Dealer gets withdrawals */
    @CreateRequestContext()
    async getWithdrawals(dealerUserId: string): Promise<PointsWithdrawal[]> {
        const dealer = await this.em.findOne(DealerProfile, { userId: dealerUserId });
        if (!dealer) throw AppErrors.dbEntityNotFound('Dealer profile not found');
        return this.em.find(PointsWithdrawal, { dealer: dealer.id }, { orderBy: { requestedAt: 'DESC' } });
    }

    /** Admin lists all withdrawals (pending first) */
    @CreateRequestContext()
    async getAllWithdrawals(pagination: PaginationDto): Promise<{ data: PointsWithdrawal[]; total: number }> {
        const [data, total] = await this.em.findAndCount(
            PointsWithdrawal,
            {},
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.offset ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: { requestedAt: 'DESC' },
                populate: ['dealer'],
            }
        );
        return { data, total };
    }

    /** Admin/Manager lists all dealers */
    @CreateRequestContext()
    async findAll(pagination: PaginationDto): Promise<{ data: DealerProfile[]; total: number }> {
        const [data, total] = await this.em.findAndCount(
            DealerProfile,
            {},
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.offset ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: { createdAt: 'DESC' },
            }
        );
        return { data, total };
    }
}
