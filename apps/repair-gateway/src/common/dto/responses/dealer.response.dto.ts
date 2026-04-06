import { ApiProperty } from '@nestjs/swagger';
import { AuthUserDto } from '@asko/gateway-common';

export class DealerProfileRecordDto {
    id: string;
    userId: string;
    companyName?: string;
    inn?: string;
    pointsBalance: number;
    agreementSignature?: string;
    agreementSignedPayload?: string;
    user?: AuthUserDto;
    @ApiProperty({ type: () => [DealerClientRecordDto] })
    clients?: DealerClientRecordDto[];
    createdAt: string;
    updatedAt: string;
}

export class DealerProfileResponseDto {
    profile: DealerProfileRecordDto;
}

export class PaginatedDealersResponseDto {
    @ApiProperty({ type: [DealerProfileRecordDto] })
    data: DealerProfileRecordDto[];
    overallCount: number;
    page: number;
    limit: number;
}

export class DealerClientRecordDto {
    id: string;
    dealerId: string;
    clientUserId: string;
    clientUser?: AuthUserDto;
    createdAt: string;
}

export class DealerClientResponseDto {
    client: DealerClientRecordDto;
}

export class DealerClientListResponseDto {
    @ApiProperty({ type: [DealerClientRecordDto] })
    clients: DealerClientRecordDto[];
}

export class DealerUserDeviceRecordDto {
    id: string;
    userId: string;
    deviceId: string;
    serialNumber: string;
    deviceName: string;
    deviceModel: string;
    deviceBrand: string;
}

export class DealerUserDeviceListResponseDto {
    @ApiProperty({ type: [DealerUserDeviceRecordDto] })
    devices: DealerUserDeviceRecordDto[];
}

export class PointsTransactionRecordDto {
    id: string;
    dealerId: string;
    type: string;
    amount: number;
    reason: string;
    repairRequestId?: string;
    createdAt: string;
}

export class PaginatedPointsResponseDto {
    @ApiProperty({ type: [PointsTransactionRecordDto] })
    data: PointsTransactionRecordDto[];
    overallCount: number;
    page: number;
    limit: number;
}

export class WithdrawalRecordDto {
    id: string;
    dealerId: string;
    amount: number;
    status: string;
    requestedAt: string;
    processedAt?: string;
    processedByUserId?: string;
}

export class WithdrawalResponseDto {
    withdrawal: WithdrawalRecordDto;
}

export class WithdrawalListResponseDto {
    @ApiProperty({ type: [WithdrawalRecordDto] })
    withdrawals: WithdrawalRecordDto[];
}

export class PaginatedWithdrawalsResponseDto {
    @ApiProperty({ type: [WithdrawalRecordDto] })
    data: WithdrawalRecordDto[];
    overallCount: number;
    page: number;
    limit: number;
}
