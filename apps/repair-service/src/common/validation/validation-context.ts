/**
 * Base interface for all validation chain contexts.
 * Domain-specific contexts extend this with their own fields.
 */
export interface ValidationContext {
    /** Set to true by any handler that considers the entity invalid. */
    invalid: boolean;
    /** Error message when invalid. */
    errorMessage?: string;
}
