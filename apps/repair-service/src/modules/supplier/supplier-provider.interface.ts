export interface SupplierOrderInput {
    partId: string;
    name: string;
    note?: string;
    requestId: string;
}

export interface SupplierOrderResult {
    externalOrderId: string;
    estimatedShipAt?: Date;
}

export interface SupplierProvider {
    readonly name: string;
    orderPart(input: SupplierOrderInput): Promise<SupplierOrderResult>;
}
