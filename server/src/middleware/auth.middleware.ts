import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractToken } from '../utils';
import { RequestWithUser, UserRole } from '../types';
import { HTTP_STATUS, MESSAGES } from '../constants';


export const authenticate = (req: Request, res: Response, next: NextFunction): any => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.UNAUTHORIZED,
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    const user = verifyToken(token);

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.INVALID_TOKEN,
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    (req as RequestWithUser).user = user;
    next();
  } catch (error) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: MESSAGES.TOKEN_EXPIRED,
      statusCode: HTTP_STATUS.UNAUTHORIZED,
    });
  }
};


export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): any => {
    const userReq = req as RequestWithUser;
    if (!userReq.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.UNAUTHORIZED,
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    if (!allowedRoles.includes(userReq.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: MESSAGES.FORBIDDEN,
        statusCode: HTTP_STATUS.FORBIDDEN,
      });
    }

    next();
  };
};