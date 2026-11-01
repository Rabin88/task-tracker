import { z } from 'zod';

// Same limits as server/src/schemas/tasks.schema.ts and the database CHECKs.
export const TITLE_MAX = 200;
export const DESCRIPTION_MAX = 500;
export const SEARCH_MAX = 200;

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(TITLE_MAX, `Title must be at most ${TITLE_MAX} characters`),
  // An empty textarea becomes null, which clears the description on the server.
  description: z
    .string()
    .trim()
    .max(DESCRIPTION_MAX, `Description must be at most ${DESCRIPTION_MAX} characters`)
    .transform((v) => v || null),
  status: z.enum(['todo', 'in_progress', 'done'], { error: 'Status must be To do, In progress or Done' }),
});

export type TaskFormValues = z.input<typeof taskFormSchema>;
