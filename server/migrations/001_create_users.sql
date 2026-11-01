-- Users who can sign in. Passwords are stored only as bcrypt hashes.
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL,
  password      TEXT NOT NULL, -- bcrypt hash, never the plain password
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case-insensitive uniqueness: "Rabin@x.com" and "rabin@x.com" are the same account.
CREATE UNIQUE INDEX users_email_unique ON users (LOWER(email));
