import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';

// Single place where every error becomes a response.
// Response shape is always: { error: { message, details? } }
//
// Rule: the client only ever sees messages we wrote on purpose (AppError, Zod,
// body-parser's safe 4xx messages). Anything else is a 500 with a generic
// message; the real error and stack go to the logs only.
export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  // Response already partly sent (e.g. failed mid-stream): let Express close the connection.
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { message: err.message, details: err.details } });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: 'Validation failed',
        // An empty path means the error is about the whole body, not one field.
        details: err.issues.map((i) => ({ field: i.path.join('.') || 'body', message: i.message })),
      },
    });
    return;
  }

  // Malformed JSON body (thrown by express.json())
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: { message: 'Invalid JSON body' } });
    return;
  }

  // Other request errors from express.json(), e.g. body too large (413) or
  // unsupported encoding (415). `expose` means the message is safe for clients.
  if (err?.expose === true && err.status >= 400 && err.status < 500) {
    res.status(err.status).json({ error: { message: err.message } });
    return;
  }

  // Anything else is unexpected. Attaching it to res.err makes the request
  // logger include the error and stack in its log line for this request.
  res.err = err;
  res.status(500).json({ error: { message: 'Internal server error' } });
};
