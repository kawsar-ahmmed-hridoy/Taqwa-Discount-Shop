import { Request, Response } from 'express';
import { listStaff, requestStaffVerification, confirmStaffVerification, updateStaff, deleteStaff } from './staff.service';
import { RequestWithUser } from '../../types';
import { recordAuditLog } from '../audit-logs/audit-logs.service';
import { HTTP_STATUS } from '../../constants';

export const getStaff = async (_req: Request, res: Response): Promise<any> => {
  try {
    const data = await listStaff();
    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to fetch staff' });
  }
};

export const postStaff = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, fullName, password, role, isActive } = req.body;

    if (!email || !fullName || !password || !role) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'email, fullName, password, and role are required',
      });
    }

    const verification = await requestStaffVerification({ email, fullName, password, role, isActive });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Verification code sent to Gmail',
      data: verification,
    });
  } catch (error: any) {
    return res.status(error.statusCode || HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: error.message || 'Failed to start staff verification',
    });
  }
};

export const postStaffVerification = async (req: Request, res: Response): Promise<any> => {
  try {
    const { verificationId, code } = req.body;

    if (!verificationId || !code) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'verificationId and code are required',
      });
    }

    const data = await confirmStaffVerification({ verificationId: Number(verificationId), code });
    const userReq = req as RequestWithUser;
    if (userReq.user) {
      await recordAuditLog({
        userId: Number(userReq.user.id),
        actorRole: userReq.user.role,
        action: 'STAFF_CREATED',
        entity: 'USER',
        entityId: data.id,
        details: `${data.fullName} (${data.email}) created as ${data.role} after Gmail verification`,
        ipAddress: req.ip,
      });
    }
    return res.status(HTTP_STATUS.CREATED).json({ success: true, data, message: 'Staff created successfully' });
  } catch (error: any) {
    return res.status(error.statusCode || HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: error.message || 'Failed to verify staff code',
    });
  }
};

export const putStaff = async (req: Request, res: Response): Promise<any> => {
  try {
    const data = await updateStaff(Number(req.params.id), req.body);
    const userReq = req as RequestWithUser;
    if (userReq.user) {
      await recordAuditLog({
        userId: Number(userReq.user.id),
        actorRole: userReq.user.role,
        action: 'STAFF_UPDATED',
        entity: 'USER',
        entityId: data.id,
        details: `${data.fullName} (${data.email}) updated`,
        ipAddress: req.ip,
      });
    }
    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to update staff' });
  }
};

export const removeStaff = async (req: Request, res: Response): Promise<any> => {
  try {
    const userReq = req as RequestWithUser;
    const result = await deleteStaff(Number(req.params.id));
    const message = 'isActive' in result && result.isActive === false
      ? 'Staff deactivated successfully'
      : 'Staff deleted successfully';
    if (userReq.user) {
      await recordAuditLog({
        userId: Number(userReq.user.id),
        actorRole: userReq.user.role,
        action: 'isActive' in result && result.isActive === false ? 'STAFF_DEACTIVATED' : 'STAFF_DELETED',
        entity: 'USER',
        entityId: result.id,
        details: 'isActive' in result && result.isActive === false
          ? `${result.fullName} (${result.email}) deactivated`
          : `${result.fullName} (${result.email}) deleted`,
        ipAddress: req.ip,
      });
    }
    return res.json({ success: true, message });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to delete staff' });
  }
};
