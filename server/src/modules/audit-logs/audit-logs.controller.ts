import { Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { listAuditLogs } from './audit-logs.service';

const parseRole = (value: unknown): UserRole | undefined => {
  if (value === 'OWNER' || value === 'MANAGER' || value === 'STAFF') {
    return value;
  }
  return undefined;
};

export const getAuditLogs = async (req: Request, res: Response): Promise<any> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 25, 100);
    const action = req.query.action ? String(req.query.action).trim() : undefined;
    const entity = req.query.entity ? String(req.query.entity).trim() : undefined;
    const role = parseRole(req.query.role);
    const userId = req.query.userId ? Number(req.query.userId) : undefined;
    const search = req.query.search ? String(req.query.search).trim() : undefined;
    const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
    const endDate = req.query.endDate ? String(req.query.endDate) : undefined;

    const result = await listAuditLogs({
      page,
      limit,
      action,
      entity,
      role,
      userId,
      search,
      startDate,
      endDate,
    });

    return res.json({ success: true, data: result.data, pagination: result.pagination, summary: result.summary });
  } catch (error) {
    console.error('getAuditLogs error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
};