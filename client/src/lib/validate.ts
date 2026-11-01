import type { z } from 'zod';
import type { FieldErrors } from './fieldErrors';

// Runs a schema on form values and returns either the parsed data or the
// first error message per field, ready to show next to each input.
export function validate<S extends z.ZodType>(
  schema: S,
  values: unknown,
): { data: z.infer<S>; errors: null } | { data: null; errors: FieldErrors } {
  const result = schema.safeParse(values);
  if (result.success) return { data: result.data, errors: null };

  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    errors[issue.path.join('.') || 'form'] ??= issue.message;
  }
  return { data: null, errors };
}
