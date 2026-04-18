import type { AddressValidationContext } from './address-validation-context';

/**
 * Abstract base for Chain of Responsibility address validation handlers.
 *
 * Each handler either:
 *   - Marks ctx.invalid = true (short-circuits the chain)
 *   - Enriches the context and delegates to next
 */
export abstract class AddressValidationHandler {
    private nextHandler?: AddressValidationHandler;

    setNext(handler: AddressValidationHandler): AddressValidationHandler {
        this.nextHandler = handler;
        return handler;
    }

    async handle(ctx: AddressValidationContext): Promise<void> {
        await this.process(ctx);
        if (!ctx.invalid && this.nextHandler) {
            await this.nextHandler.handle(ctx);
        }
    }

    protected abstract process(ctx: AddressValidationContext): Promise<void>;
}
