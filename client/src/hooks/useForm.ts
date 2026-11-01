import { useState, type FormEvent } from 'react';
import type { z } from 'zod';
import { toFormErrors } from '../api/errors';
import type { FieldErrors } from '../lib/fieldErrors';
import { validate } from '../lib/validate';

type Options<Values, Output> = {
  schema: z.ZodType<Output, Values>;
  initialValues: Values;
  onSubmit: (data: Output) => Promise<void>;
  resetOnSuccess?: boolean;
};

// Form state shared by every form in the app:
// 1. validate with the Zod schema; on failure show errors and send nothing
// 2. call onSubmit with the parsed data (trimmed, lowercased, etc.)
// 3. if the API rejects it, show its field errors under the inputs, or one message above the form
// A field's error clears as soon as the user edits it.
export function useForm<Values extends Record<string, string>, Output>({
  schema,
  initialValues,
  onSubmit,
  resetOnSuccess = false,
}: Options<Values, Output>) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Props for an MUI TextField: value, onChange, error state and message.
  function field(name: keyof Values & string) {
    return {
      name,
      value: values[name],
      onChange: (e: { target: { value: string } }) => {
        setValues((v) => ({ ...v, [name]: e.target.value }));
        setErrors((errs) => ({ ...errs, [name]: '' }));
      },
      error: Boolean(errors[name]),
      helperText: errors[name] || undefined,
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const { data, errors } = validate(schema, values);
    if (errors) {
      setErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(data as Output);
      if (resetOnSuccess) {
        setValues(initialValues);
        setErrors({});
      }
    } catch (err) {
      const { fieldErrors, formError } = toFormErrors(err);
      setErrors(fieldErrors);
      setFormError(formError);
    } finally {
      setSubmitting(false);
    }
  }

  return { values, errors, formError, submitting, field, handleSubmit };
}
