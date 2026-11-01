// Shapes returned by /api/auth (see server/README.md). Dates arrive as ISO strings.

export type User = {
  id: string;
  email: string;
  created_at: string;
};

export type AuthResult = { user: User; token: string };
