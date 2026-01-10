import { Response } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, isActive, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (categoryId) where.categoryId = Number(categoryId);
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
    });
  }
};

export const getProductById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: {
        category: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Get product error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
    });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const product = await prisma.product.create({
      data: {
        ...req.body,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
      },
      include: {
        category: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE',
        entity: 'PRODUCT',
        entityId: product.id,
        details: `Created product: ${product.name}`,
        ipAddress: req.ip,
      },
    });

    return res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error('Create product error:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Product with this SKU or barcode already exists',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create product',
    });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        ...req.body,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
      },
      include: {
        category: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE',
        entity: 'PRODUCT',
        entityId: product.id,
        details: `Updated product: ${product.name}`,
        ipAddress: req.ip,
      },
    });

    return res.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error('Update product error:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update product',
    });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id: Number(id) },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE',
        entity: 'PRODUCT',
        entityId: Number(id),
        details: `Deleted product ID: ${id}`,
        ipAddress: req.ip,
      },
    });

    return res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete product error:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to delete product',
    });
  }
};

export const getLowStockProducts = async (res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        stockQuantity: {
          lte: prisma.product.fields.minStockLevel,
        },
      },
      include: {
        category: true,
      },
    });

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock products',
    });
  }
};

export const getExpiringProducts = async (req: AuthRequest, res: Response) => {
  try {
    const daysAhead = Number(req.query.days) || 30;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysAhead);

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        expiryDate: {
          lte: expiryDate,
          gte: new Date(),
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Get expiring products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expiring products',
    });
  }
};

export const searchProducts = async (req: AuthRequest, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q } },
          { barcode: { contains: q } },
          { sku: { contains: q } },
          { brand: { contains: q } },
        ],
      },
      include: {
        category: true,
      },
      take: 20,
    });

    return res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Search products error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search products',
    });
  }
};