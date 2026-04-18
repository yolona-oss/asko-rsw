import { ValidationHandler } from 'common/validation';
import type { AddressValidationContext } from './address-validation-context';

/**
 * Base class for address validation chain handlers.
 * Extends the generic ValidationHandler with address-specific context.
 */
export abstract class AddressValidationHandler extends ValidationHandler<AddressValidationContext> {}
