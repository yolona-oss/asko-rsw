import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom, Observable } from 'rxjs';
import type { RepairerServiceClient, RepairerResponse, EmptyRepairerResponse } from '@asko/proto';

async function grpcCall<T>(observable: Observable<T>): Promise<T> {
    return lastValueFrom(observable);
}

@Injectable()
export class RepairerClientService implements OnModuleInit {
    private repairerService!: RepairerServiceClient;

    constructor(@Inject('REPAIRER_PACKAGE') private readonly client: ClientGrpc) {}

    onModuleInit() {
        this.repairerService = this.client.getService<RepairerServiceClient>('RepairerService');
    }

    findById(id: string): Promise<RepairerResponse> {
        return grpcCall(this.repairerService.findRepairerById({ id }));
    }

    findByUserId(userId: string): Promise<RepairerResponse> {
        return grpcCall(this.repairerService.findByUserId({ userId }));
    }

    incrementCompleted(id: string): Promise<EmptyRepairerResponse> {
        return grpcCall(this.repairerService.incrementCompleted({ id }));
    }

    updateLastLocation(id: string, latitude: number, longitude: number): Promise<EmptyRepairerResponse> {
        return grpcCall(this.repairerService.updateLastLocation({ id, latitude, longitude }));
    }
}
