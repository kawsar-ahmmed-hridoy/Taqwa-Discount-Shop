import { getPrismaClient } from '../../config';

const prisma = getPrismaClient();

export const listNotifications = async () =>
  prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });

export const markNotificationAsRead = async (id: number) =>
  prisma.notification.update({ where: { id }, data: { isRead: true } });

export const markAllNotificationsAsRead = async () =>
  prisma.notification.updateMany({ where: { isRead: false }, data: { isRead: true } });

export const createNotification = async (payload: {
  type: string;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
}) => prisma.notification.create({ data: payload });
