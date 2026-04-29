import { Request, Response } from 'express';
import { getDashboardData } from './dashboard.service';

export const getDashboard = async (_req: Request, res: Response): Promise<any> => {
  try {
    const data = await getDashboardData();
    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
  }
};
