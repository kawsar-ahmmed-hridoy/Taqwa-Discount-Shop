import { Request, Response } from 'express';
import { listCustomers, createCustomer, updateCustomer, getCustomerHistory } from './customers.service';

export const getCustomers = async (req: Request, res: Response): Promise<any> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const search = req.query.search ? String(req.query.search) : undefined;

    const result = await listCustomers({ page, limit, search });
    return res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to fetch customers' });
  }
};


export const postCustomer = async (req: Request, res: Response): Promise<any> => {
  try {
    const customer = await createCustomer(req.body);
    return res.status(201).json({ success: true, data: customer });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to create customer' });
  }
};


export const putCustomer = async (req: Request, res: Response): Promise<any> => {
  try {
    const customer = await updateCustomer(Number(req.params.id), req.body);
    return res.json({ success: true, data: customer });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to update customer' });
  }
};


export const getCustomerSalesHistory = async (req: Request, res: Response): Promise<any> => {
  try {
    const sales = await getCustomerHistory(Number(req.params.id));
    return res.json({ success: true, data: sales });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to fetch customer history' });
  }
};
