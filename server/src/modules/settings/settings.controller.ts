import { Request, Response } from 'express';
import { getSettings, updateSettings } from './settings.service';

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
    return res.json({ success: true, message: 'Settings updated successfully' });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
};
