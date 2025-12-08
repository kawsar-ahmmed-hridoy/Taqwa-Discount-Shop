import { AuthRequest } from "../middleware/auth.middleware";
import { Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.settings.findMany();
    const data = settings.reduce((acc: any, s: { key: string | number; value: any; }) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const updates = Object.entries(req.body).map(([key, value]) =>
      prisma.settings.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    );
    await Promise.all(updates);
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
};
