import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';

export interface AuthenticatedRequest extends Request {
  clerkUserId?: string;
}

export const requireClerkAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const auth = getAuth(req);

    if (!auth || !auth.userId) {
      // In development mode, if user is testing before pasting keys, allow test user header if explicitly enabled
      if (process.env.ALLOW_DEV_GUEST === 'true' && req.headers['x-dev-user-id']) {
        req.clerkUserId = req.headers['x-dev-user-id'] as string;
        return next();
      }

      res.status(401).json({
        error: 'Unauthorized',
        message: 'Valid Clerk session token is required to access this resource.',
      });
      return;
    }

    req.clerkUserId = auth.userId;
    return next();
  } catch (err: any) {
    console.error('Clerk Auth Middleware Error:', err);
    res.status(401).json({
      error: 'Authentication failed',
      message: err.message || 'Failed to authenticate user with Clerk',
    });
  }
};
