import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom, Observable } from 'rxjs';
import type { UserServiceClient, PaginatedUsersResponse } from '@asko/proto';

@Injectable()
export class UserClientService implements OnModuleInit {
    private userService!: UserServiceClient;

    constructor(@Inject('USER_PACKAGE') private readonly client: ClientGrpc) {}

    onModuleInit() {
        this.userService = this.client.getService<UserServiceClient>('UserService');
    }

    findAllUsers(data: { role?: string; limit?: number }): Promise<PaginatedUsersResponse> {
        return unwrap(
            this.userService.findAllUsers({
                page: 0,
                limit: data.limit ?? 500,
                search: '',
                role: data.role ?? '',
                status: '',
                sortBy: '',
                sortOrder: '',
            }),
        );
    }
}

function unwrap<T>(obs: Observable<T>): Promise<T> {
    return lastValueFrom(obs);
}
