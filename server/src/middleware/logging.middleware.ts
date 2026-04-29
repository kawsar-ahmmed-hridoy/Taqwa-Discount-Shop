import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? '❌' : '✅';
    console.log(
      `${logLevel} ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`
    );
  });

  next();
};

export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  (req as any).id = id;
  res.setHeader('X-Request-ID', id);
  next();
};

export const sanitizeBody = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    const sanitizeValue = (value: any): any => {
      if (typeof value === 'string') {
        return value.replace(/[<>]/g, '');
      }
      if (Array.isArray(value)) {
        return value.map(sanitizeValue);
      }
      if (typeof value === 'object' && value !== null) {
        const sanitized: any = {};
        for (const key in value) {
          sanitized[key] = sanitizeValue(value[key]);
        }
        return sanitized;
      }
      return value;
    };
    req.body = sanitizeValue(req.body);
  }
  next();
};
