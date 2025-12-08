import { AuthRequest } from "../middleware/auth.middleware";
import { Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getExpenses = async (req: AuthRequest, res: Response) => {
  try {
    const { status, startDate, endDate } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate as string);
      if (endDate) where.expenseDate.lte = new Date(endDate as string);
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: { user: { select: { fullName: true } } },
      orderBy: { expenseDate: 'desc' },
    });
    res.json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch expenses' });
  }
};

export const createExpense = async (req: AuthRequest, res: Response) => {
  try {
    const expense = await prisma.expense.create({
      data: { ...req.body, userId: req.user!.id },
    });
    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create expense' });
  }
};

export const approveExpense = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const expense = await prisma.expense.update({
      where: { id: Number(req.params.id) },
      data: { status },
    });
    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to approve expense' });
  }
};
