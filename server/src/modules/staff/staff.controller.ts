import { Request, Response } from 'express';
import { listStaff, createStaff, updateStaff, deleteStaff } from './staff.service';

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
    const data = await createStaff(req.body);
    return res.status(201).json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to create staff' });
  }
};

export const putStaff = async (req: Request, res: Response): Promise<any> => {
  try {
    const data = await updateStaff(Number(req.params.id), req.body);
    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to update staff' });
  }
};

export const removeStaff = async (req: Request, res: Response): Promise<any> => {
  try {
    await deleteStaff(Number(req.params.id));
    return res.json({ success: true, message: 'Staff deleted successfully' });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to delete staff' });
  }
};
