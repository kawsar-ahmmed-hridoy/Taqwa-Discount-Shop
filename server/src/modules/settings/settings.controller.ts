import { Request, Response } from 'express';
import { RequestWithUser } from '../../types';
import { getSettings, updateSettings } from './settings.service';
import { recordAuditLog } from '../audit-logs/audit-logs.service';

export const fetchSettings = async (_req: Request, res: Response): Promise<any> => {
  try {
    const data = await getSettings();
    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
};

export const putSettings = async (req: Request, res: Response): Promise<any> => {
  try {
    await updateSettings(req.body);
    const userReq = req as RequestWithUser;
    if (userReq.user) {
      await recordAuditLog({
        userId: Number(userReq.user.id),
        actorRole: userReq.user.role,
        action: 'SETTINGS_UPDATED',
        entity: 'SETTINGS',
        details: `Updated settings: ${Object.keys(req.body || {}).join(', ')}`,
        ipAddress: req.ip,
      });
    }
    return res.json({ success: true, message: 'Settings updated successfully' });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
};
