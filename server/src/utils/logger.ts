import pino from 'pino';
import { env } from '../config/env';

// One shared logger for the whole app. Everything goes to stdout, which is
// what the terminal shows locally and what Render collects in its Logs tab.
// - development: readable, coloured lines (pino-pretty)
// - production:  one JSON object per line (easy to search on Render)
// - test:        silent, so test output stays clean
export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : env.NODE_ENV === 'production' ? 'info' : 'debug',
  // Never write secrets to the logs.
  redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]', '*.password'],
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname,req,res,responseTime' } }
      : undefined,
});
