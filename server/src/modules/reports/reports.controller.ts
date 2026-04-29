import { Request, Response } from 'express';
import { getSalesReport, getInventoryReport, getExpenseReport } from './reports.service';

export const salesReport = async (req: Request, res: Response): Promise<any> => {
  try {
    const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
    const endDate = req.query.endDate ? String(req.query.endDate) : undefined;
    const data = await getSalesReport({ startDate, endDate });
    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to generate sales report' });
  }
};

export const inventoryReport = async (_req: Request, res: Response): Promise<any> => {
  try {
    const data = await getInventoryReport();
    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to generate inventory report' });
  }
};

export const expenseReport = async (req: Request, res: Response): Promise<any> => {
  try {
    const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
    const endDate = req.query.endDate ? String(req.query.endDate) : undefined;
    const data = await getExpenseReport({ startDate, endDate });
    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to generate expense report' });
  }
};
