import { Prisma, UserRole } from '@prisma/client';
import { getPrismaClient } from '../../config';

const prisma = getPrismaClient();

const CRITICAL_ACTIONS = new Set([
  'PRODUCT_DELETED',
  'STAFF_CREATED',
  'STAFF_UPDATED',
  'STAFF_DELETED',
  'STAFF_DEACTIVATED',
  'SETTINGS_UPDATED',
  'PURCHASE_ORDER_STATUS_UPDATED',
  'EXPENSE_APPROVED',
  'REFUND_APPROVED',
  'REFUND_REJECTED',
  'REFUND_PROCESSED',
  'PASSWORD_RESET',
  'LOGIN',
  'SIGNUP',
  'LOGOUT',
]);

const truncate = (value?: string | null) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > 180 ? `${trimmed.slice(0, 177)}...` : trimmed;
};

export const recordAuditLog = async (entry: {
  userId: number;
  actorRole?: UserRole | null;
  action: string;
  entity: string;
  entityId?: number | null;
  details?: string | null;
  ipAddress?: string | null;
}) => {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        actorRole: entry.actorRole ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        details: truncate(entry.details),
        ipAddress: truncate(entry.ipAddress),
      },
    });
  } catch (error) {
    console.error('Failed to create audit log entry:', error);
    return null;
  }
};

export const listAuditLogs = async (query: {
  page: number;
  limit: number;
  action?: string;
  entity?: string;
  role?: UserRole;
  userId?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const where: Prisma.AuditLogWhereInput = {};

  if (query.action) where.action = query.action;
  if (query.entity) where.entity = query.entity;
  if (query.role) where.actorRole = query.role;
  if (query.userId) where.userId = query.userId;

  if (query.startDate || query.endDate) {
    where.createdAt = {};
    if (query.startDate) where.createdAt.gte = new Date(query.startDate);
    if (query.endDate) where.createdAt.lte = new Date(query.endDate);
  }

  if (query.search) {
    where.OR = [
      { action: { contains: query.search } },
      { entity: { contains: query.search } },
      { details: { contains: query.search } },
      { user: { fullName: { contains: query.search } } },
      { user: { email: { contains: query.search } } },
    ];
  }

  const skip = (query.page - 1) * query.limit;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [data, total, todayCount, criticalCount, ownerCount] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true, isActive: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.count({
      where: {
        ...where,
        createdAt: query.startDate || query.endDate ? where.createdAt : { gte: todayStart },
      },
    }),
    prisma.auditLog.count({
      where: {
        ...where,
        action: { in: Array.from(CRITICAL_ACTIONS) },
      },
    }),
    prisma.auditLog.count({
      where: {
        ...where,
        actorRole: 'OWNER',
      },
    }),
  ]);

  return {
    data,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    },
    summary: {
      total,
      todayCount,
      criticalCount,
      ownerCount,
    },
  };
};