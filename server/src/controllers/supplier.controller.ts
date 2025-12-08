import { AuthRequest } from "../middleware/auth.middleware";
import { Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getSuppliers = async (req: AuthRequest, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch suppliers' });
  }
};

export const createSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const supplier = await prisma.supplier.create({ data: req.body });
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE',
        entity: 'SUPPLIER',
        entityId: supplier.id,
        details: `Created supplier: ${supplier.name}`,
        ipAddress: req.ip,
      },
    });
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create supplier' });
  }
};

export const updateSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const supplier = await prisma.supplier.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update supplier' });
  }
};

export const deleteSupplier = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.supplier.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete supplier' });
  }
};
