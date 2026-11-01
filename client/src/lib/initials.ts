// "john.smith@x.com" -> "JS", "test123@test.com" -> "T"
export function initials(email: string) {
  const parts = email
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}
