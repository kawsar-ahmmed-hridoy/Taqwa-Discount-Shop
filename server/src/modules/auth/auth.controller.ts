import { Request, Response } from 'express';
import { RequestWithUser } from '../../types';
import {
  loginService,
  signupService,
  getCurrentUserService,
  logoutService,
  resetPasswordService,
} from './auth.service';
import { HTTP_STATUS, MESSAGES } from '../../constants';
import { getPrismaClient } from '../../config';

const prisma = getPrismaClient();


export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const result = await loginService({ email, password });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error: any) {
    return res.status(error.statusCode || HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};



export const signup = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password, fullName, role } = req.body;

    if (!email || !password || !fullName) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Email, password, and fullName are required',
      });
    }

    const result = await signupService({ email, password, fullName, role });

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Signup successful',
      data: result,
    });
  } catch (error: any) {
    return res.status(error.statusCode || HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};



export const getCurrentUser = async (req: RequestWithUser, res: Response): Promise<any> => {
  try {
    if (!req.user?.id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.UNAUTHORIZED,
      });
    }

    const user = await getCurrentUserService(Number(req.user.id));

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Current user retrieved successfully',
      data: user,
    });
  } catch (error: any) {
    return res.status(error.statusCode || HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};



export const logout = async (req: Request, res: Response): Promise<any> => {
  try {
    const userReq = req as RequestWithUser;
    if (userReq.user?.id) {
      await logoutService(Number(userReq.user.id));
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    return res.status(error.statusCode || HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};



export const resetPassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const userReq = req as RequestWithUser;
    if (!userReq.user?.id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.UNAUTHORIZED,
      });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'currentPassword and newPassword are required',
      });
    }

    await resetPasswordService({
      userId: Number(userReq.user.id),
      currentPassword,
      newPassword,
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error: any) {
    return res.status(error.statusCode || HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};


export const forgotPassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if email exists or not for security
    if (!user) {
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'If an account with this email exists, a reset link will be sent shortly.',
      });
    }

    // TODO: Implement email sending with reset token
    // For now, just return success
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'If an account with this email exists, a reset link will be sent shortly.',
    });
  } catch (error: any) {
    return res.status(error.statusCode || HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};
