import { Request, Response } from 'express';
import {
  listNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
} from './notifications.service';

export const getNotifications = async (_req: Request, res: Response): Promise<any> => {
  try {
    const data = await listNotifications();
    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

export const putNotificationRead = async (req: Request, res: Response): Promise<any> => {
  try {
    await markNotificationAsRead(Number(req.params.id));
    return res.json({ success: true, message: 'Notification marked as read' });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
};

export const putAllNotificationsRead = async (_req: Request, res: Response): Promise<any> => {
  try {
    const result = await markAllNotificationsAsRead();
    return res.json({ success: true, data: result, message: 'All notifications marked as read' });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to mark all notifications as read' });
  }
};

export const postNotification = async (req: Request, res: Response): Promise<any> => {
  try {
    const data = await createNotification(req.body);
    return res.status(201).json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to create notification' });
  }
};
