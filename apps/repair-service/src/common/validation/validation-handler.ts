import type { ValidationContext } from './validation-context';

/**
 * Generic Chain of Responsibility handler for validation pipelines.
 *
 * Each handler either:
 *   - Marks ctx.invalid = true and sets ctx.errorMessage (short-circuits the chain)
 *   - Enriches the context and delegates to next
 */
export abstract class ValidationHandler<T extends ValidationContext> {
    private nextHandler?: ValidationHandler<T>;

    setNext(handler: ValidationHandler<T>): ValidationHandler<T> {
        this.nextHandler = handler;
        return handler;
    }

    async handle(ctx: T): Promise<void> {
        await this.process(ctx);
        if (!ctx.invalid && this.nextHandler) {
            await this.nextHandler.handle(ctx);
        }
    }

    protected abstract process(ctx: T): Promise<void>;
}
