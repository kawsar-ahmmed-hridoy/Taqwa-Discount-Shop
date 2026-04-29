import { Request, Response } from 'express';
import { listSuppliers, createSupplier, updateSupplier, deleteSupplier } from './suppliers.service';

export const getSuppliers = async (_req: Request, res: Response): Promise<any> => {
  try {
    const data = await listSuppliers();
    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to fetch suppliers' });
  }
};

export const postSupplier = async (req: Request, res: Response): Promise<any> => {
  try {
    const data = await createSupplier(req.body);
    return res.status(201).json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to create supplier' });
  }
};

export const putSupplier = async (req: Request, res: Response): Promise<any> => {
  try {
    const data = await updateSupplier(Number(req.params.id), req.body);
    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to update supplier' });
  }
};

export const removeSupplier = async (req: Request, res: Response): Promise<any> => {
  try {
    await deleteSupplier(Number(req.params.id));
    return res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to delete supplier' });
  }
};
