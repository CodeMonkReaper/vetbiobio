import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const headerName = 'x-request-id';
    const existing = req.headers[headerName];
    const requestId = (typeof existing === 'string' && existing.length > 0)
      ? existing
      : crypto.randomUUID();

    req.headers[headerName] = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  }
}
