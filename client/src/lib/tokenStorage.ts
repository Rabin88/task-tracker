// Where the login token is kept between page loads. Shared because the API client
// reads it on every request and the auth feature writes it on login/logout.
const TOKEN_KEY = 'task-tracker-token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};
