import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { DealerProfile, DealerClient, PointsTransaction, PointsWithdrawal, User, Certificate, UserDevice } from 'entities';
import {
    CreateDealerProfileDto,
    UpdateDealerProfileDto,
    AddDealerClientDto,
    RequestPointsWithdrawalDto,
    ProcessWithdrawalDto,
    PointsTransactionType,
    WithdrawalStatus,
    CertificateStatus,
    Role,
    PaginationDto,
} from '@asko/shared';
import { AppErrors } from 'common/error';

/** Points per approved certificate (configurable) */
const POINTS_PER_CERTIFICATE = 100;

@Injectable()
export class DealerService {
    constructor(private readonly em: EntityManager) {}

    /** Admin creates dealer profile for a user */
    async createProfile(dto: CreateDealerProfileDto): Promise<DealerProfile> {
        const user = await this.em.findOne(User, { id: dto.userId });
        if (!user) throw AppErrors.dbEntityNotFound('User not found');

        if (!user.roles.includes(Role.DEALER)) {
            user.roles = [...user.roles, Role.DEALER];
        }

        const existing = await this.em.findOne(DealerProfile, { user: dto.userId });
        if (existing) throw AppErrors.dbEntityExists('Dealer profile already exists');

        const profile = this.em.create(DealerProfile, {
            user: user,
            companyName: dto.companyName,
            inn: dto.inn,
        });
        await this.em.persistAndFlush(profile);
        return profile;
    }

    /** Dealer updates own profile */
    async updateProfile(dealerUserId: string, dto: UpdateDealerProfileDto): Promise<DealerProfile> {
        const profile = await this.em.findOne(DealerProfile, { user: dealerUserId });
        if (!profile) throw AppErrors.dbEntityNotFound('Dealer profile not found');
        this.em.assign(profile, dto);
        await this.em.flush();
        return profile;
    }

    /** Get dealer profile */
    async getProfile(dealerUserId: string): Promise<DealerProfile> {
        const profile = await this.em.findOne(DealerProfile, { user: dealerUserId }, { populate: ['user', 'clients', 'clients.clientUser'] });
        if (!profile) throw AppErrors.dbEntityNotFound('Dealer profile not found');
        return profile;
    }

    /** Dealer adds a client */
    async addClient(dealerUserId: string, dto: AddDealerClientDto): Promise<DealerClient> {
        const dealer = await this.em.findOne(DealerProfile, { user: dealerUserId });
        if (!dealer) throw AppErrors.dbEntityNotFound('Dealer profile not found');

        const clientUser = await this.em.findOne(User, { id: dto.clientUserId });
        if (!clientUser) throw AppErrors.dbEntityNotFound('Client user not found');

        const existing = await this.em.findOne(DealerClient, { dealer: dealer.id, clientUser: dto.clientUserId });
        if (existing) throw AppErrors.dbEntityExists('Client already linked');

        const client = this.em.create(DealerClient, {
            dealer: dealer,
            clientUser: clientUser,
        });
        await this.em.persistAndFlush(client);
        return client;
    }

    /** Auto-link client when certificate is approved (called from certificate approval) */
    async linkClientOnCertificateApproval(certificate: Certificate): Promise<void> {
        if (!certificate.dealer) return;

        const dealerId = certificate.dealer.id;
        const clientUserId = certificate.user.id;

        const existing = await this.em.findOne(DealerClient, { dealer: dealerId, clientUser: clientUserId });
        if (!existing) {
            const client = this.em.create(DealerClient, {
                dealer: dealerId,
                clientUser: clientUserId,
            });
            await this.em.persist(client);
        }
    }

    /** Award points to dealer when certificate approved */
    async awardPointsForCertificate(certificate: Certificate): Promise<void> {
        if (!certificate.dealer) return;

        const dealer = await this.em.findOne(DealerProfile, { id: certificate.dealer.id });
        if (!dealer) return;

        dealer.pointsBalance += POINTS_PER_CERTIFICATE;

        const transaction = this.em.create(PointsTransaction, {
            dealer: dealer,
            type: PointsTransactionType.EARNED,
            amount: POINTS_PER_CERTIFICATE,
            reason: `Certificate ${certificate.certificateNumber} approved`,
        });
        await this.em.persist(transaction);
        await this.em.flush();
    }

    /** Dealer gets client list */
    async getClients(dealerUserId: string): Promise<DealerClient[]> {
        const dealer = await this.em.findOne(DealerProfile, { user: dealerUserId });
        if (!dealer) throw AppErrors.dbEntityNotFound('Dealer profile not found');
        return this.em.find(DealerClient, { dealer: dealer.id }, { populate: ['clientUser'] });
    }

    /** Search user by email (for certificate wizard) */
    async searchUserByEmail(email: string): Promise<Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>[]> {
        if (!email || email.length < 3) return [];
        const users = await this.em.find(
            User,
            { email: { $ilike: `%${email}%` } },
            { fields: ['id', 'firstName', 'lastName', 'email'], limit: 10 },
        );
        return users.map((u) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email }));
    }

    /** Get a user's devices (for certificate wizard) */
    async getUserDevicesForCertificate(userId: string): Promise<UserDevice[]> {
        return this.em.find(UserDevice, { user: userId }, { populate: ['device'] });
    }

    /** Dealer gets points history */
    async getPointsHistory(dealerUserId: string, pagination: PaginationDto): Promise<{ data: PointsTransaction[]; total: number }> {
        const dealer = await this.em.findOne(DealerProfile, { user: dealerUserId });
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
    async requestWithdrawal(dealerUserId: string, dto: RequestPointsWithdrawalDto): Promise<PointsWithdrawal> {
        const dealer = await this.em.findOne(DealerProfile, { user: dealerUserId });
        if (!dealer) throw AppErrors.dbEntityNotFound('Dealer profile not found');

        if (dealer.pointsBalance < dto.amount) {
            throw AppErrors.badRequest('Insufficient points balance');
        }

        const withdrawal = this.em.create(PointsWithdrawal, {
            dealer: dealer,
            amount: dto.amount,
            status: WithdrawalStatus.PENDING,
        });

        // Deduct points immediately (hold)
        dealer.pointsBalance -= dto.amount;

        const transaction = this.em.create(PointsTransaction, {
            dealer: dealer,
            type: PointsTransactionType.SPENT,
            amount: -dto.amount,
            reason: 'Points withdrawal request',
        });

        await this.em.persist(transaction);
        await this.em.persistAndFlush(withdrawal);
        return withdrawal;
    }

    /** Admin processes withdrawal */
    async processWithdrawal(withdrawalId: string, adminUserId: string, dto: ProcessWithdrawalDto): Promise<PointsWithdrawal> {
        const withdrawal = await this.em.findOne(PointsWithdrawal, { id: withdrawalId }, { populate: ['dealer'] });
        if (!withdrawal) throw AppErrors.dbEntityNotFound('Withdrawal not found');
        if (withdrawal.status !== WithdrawalStatus.PENDING) {
            throw AppErrors.badRequest('Withdrawal already processed');
        }

        withdrawal.status = dto.status;
        withdrawal.processedAt = new Date();
        withdrawal.processedBy = this.em.getReference(User, adminUserId);

        // If rejected, refund points
        if (dto.status === WithdrawalStatus.REJECTED) {
            const dealer = withdrawal.dealer;
            dealer.pointsBalance += withdrawal.amount;

            const transaction = this.em.create(PointsTransaction, {
                dealer: dealer,
                type: PointsTransactionType.ADJUSTMENT,
                amount: withdrawal.amount,
                reason: 'Withdrawal rejected - points refunded',
            });
            await this.em.persist(transaction);
        }

        await this.em.flush();
        return withdrawal;
    }

    /** Dealer gets withdrawals */
    async getWithdrawals(dealerUserId: string): Promise<PointsWithdrawal[]> {
        const dealer = await this.em.findOne(DealerProfile, { user: dealerUserId });
        if (!dealer) throw AppErrors.dbEntityNotFound('Dealer profile not found');
        return this.em.find(PointsWithdrawal, { dealer: dealer.id }, { orderBy: { requestedAt: 'DESC' } });
    }

    /** Admin lists all withdrawals (pending first) */
    async getAllWithdrawals(pagination: PaginationDto): Promise<{ data: PointsWithdrawal[]; total: number }> {
        const [data, total] = await this.em.findAndCount(
            PointsWithdrawal,
            {},
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.offset ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: { requestedAt: 'DESC' },
                populate: ['dealer', 'dealer.user'],
            }
        );
        return { data, total };
    }

    /** Admin/Manager lists all dealers */
    async findAll(pagination: PaginationDto): Promise<{ data: DealerProfile[]; total: number }> {
        const [data, total] = await this.em.findAndCount(
            DealerProfile,
            {},
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.offset ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: { createdAt: 'DESC' },
                populate: ['user'],
            }
        );
        return { data, total };
    }
}
