import bcrypt from 'bcrypt';
import { AuthRequest } from "../middleware/auth.middleware";
import { Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getStaff = async (req: AuthRequest, res: Response) => {
  try {
    const staff = await prisma.user.findMany({
      select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch staff' });
  }
};

export const createStaff = async (req: AuthRequest, res: Response) => {
  try {
    const { password, ...data } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const staff = await prisma.user.create({
      data: { ...data, password: hashedPassword },
      select: { id: true, email: true, fullName: true, role: true, isActive: true },
    });
    res.status(201).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create staff' });
  }
};

export const updateStaff = async (req: AuthRequest, res: Response) => {
  try {
    const staff = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: req.body,
      select: { id: true, email: true, fullName: true, role: true, isActive: true },
    });
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update staff' });
  }
};

export const deleteStaff = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true, message: 'Staff deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete staff' });
  }
};
