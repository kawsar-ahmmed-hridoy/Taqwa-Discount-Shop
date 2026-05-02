import { Request, Response } from 'express';
import { ExpenseStatus } from '@prisma/client';
import { RequestWithUser } from '../../types';
import { listExpenses, createExpense, approveExpense } from './expenses.service';
import { recordAuditLog } from '../audit-logs/audit-logs.service';

export const getExpenses = async (req: Request, res: Response): Promise<any> => {
  try {
    const status = req.query.status as ExpenseStatus | undefined;
    const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
    const endDate = req.query.endDate ? String(req.query.endDate) : undefined;
    const data = await listExpenses({ status, startDate, endDate });
    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to fetch expenses' });
  }
};

export const postExpense = async (req: Request, res: Response): Promise<any> => {
  try {
    const userReq = req as RequestWithUser;
    if (!userReq.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const data = await createExpense({ ...req.body, userId: Number(userReq.user.id) });
    await recordAuditLog({
      userId: Number(userReq.user.id),
      actorRole: userReq.user.role,
      action: 'EXPENSE_CREATED',
      entity: 'EXPENSE',
      entityId: data.id,
      details: `${data.category} expense for ৳${Number(data.amount).toFixed(2)}`,
      ipAddress: req.ip,
    });
    return res.status(201).json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to create expense' });
  }
};

export const putExpenseApproval = async (req: Request, res: Response): Promise<any> => {
  try {
    const status = req.body.status as ExpenseStatus;
    const data = await approveExpense(Number(req.params.id), status);
    const userReq = req as RequestWithUser;
    if (userReq.user) {
      await recordAuditLog({
        userId: Number(userReq.user.id),
        actorRole: userReq.user.role,
        action: 'EXPENSE_APPROVED',
        entity: 'EXPENSE',
        entityId: data.id,
        details: `Expense ${data.id} marked as ${status}`,
        ipAddress: req.ip,
      });
    }
    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to approve expense' });
  }
};
