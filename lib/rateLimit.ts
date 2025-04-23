import { NextApiRequest, NextApiResponse } from 'next';
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

export const applyRateLimit = (handler: Function) => (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  return new Promise((resolve, reject) => {
    limiter(req as any, res as any, (error: any) => {
      if (error) return reject(error);
      return handler(req, res);
    });
  });
};