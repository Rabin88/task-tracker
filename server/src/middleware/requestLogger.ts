import type { IncomingMessage } from 'node:http';
import type { Request } from 'express';
import { pinoHttp } from 'pino-http';
import { logger } from '../utils/logger';

// req.url is relative to the router that handled it (e.g. "/" for /api/health),
// so use Express's originalUrl to log the full path.
const fullUrl = (req: IncomingMessage) => (req as Request).originalUrl ?? req.url;

// Logs one line per request when the response finishes, e.g. "GET /api/tasks 200 12ms".
// Level follows the outcome: 5xx = error, 4xx = warn, everything else = info.
export const requestLogger = pinoHttp({
  logger,
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res, responseTime) =>
    `${req.method} ${fullUrl(req)} ${res.statusCode} ${Math.round(responseTime)}ms`,
  customErrorMessage: (req, res) => `${req.method} ${fullUrl(req)} ${res.statusCode}`,
  // Keep production log lines short: no headers, just what's useful for debugging.
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});
