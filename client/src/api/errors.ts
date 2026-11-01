import type { FieldErrors } from '../lib/fieldErrors';

// Errors from API calls, and turning them into form errors.

// Thrown by request() for any failed call. status 0 means the server couldn't be reached.
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fieldErrors: FieldErrors = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Splits a failed request into per-field errors (shown under inputs) and one
// message for the whole form. "Validation failed" is dropped when the fields
// already say what's wrong.
export function toFormErrors(err: unknown): { fieldErrors: FieldErrors; formError: string | null } {
  if (!(err instanceof ApiError)) return { fieldErrors: {}, formError: 'Something went wrong. Please try again.' };
  const hasFields = Object.keys(err.fieldErrors).length > 0;
  return { fieldErrors: err.fieldErrors, formError: hasFields ? null : err.message };
}
