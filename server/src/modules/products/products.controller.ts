import { Request, Response } from 'express';
import { RequestWithUser } from '../../types';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  removeProduct,
  getLowStockProducts,
  getExpiringProducts,
  searchProducts,
  listCategories,
} from './products.service';
import { recordAuditLog } from '../audit-logs/audit-logs.service';

export const getProducts = async (req: Request, res: Response): Promise<any> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const isActive = req.query.isActive === undefined ? undefined : req.query.isActive === 'true';

    const result = await listProducts({ page, limit, categoryId, isActive });
    return res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<any> => {
  const product = await getProduct(Number(req.params.id));
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  return res.json({ success: true, data: product });
};

export const postProduct = async (req: Request, res: Response): Promise<any> => {
  try {
    const product = await createProduct(req.body);
    const actor = (req as RequestWithUser).user;
    if (actor) {
      await recordAuditLog({
        userId: Number(actor.id),
        actorRole: actor.role,
        action: 'PRODUCT_CREATED',
        entity: 'PRODUCT',
        entityId: product.id,
        details: `${product.name} (${product.sku}) created`,
        ipAddress: req.ip,
      });
    }
    return res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Product with this SKU or barcode already exists' });
    }
    return res.status(500).json({ success: false, message: 'Failed to create product' });
  }
};

export const putProduct = async (req: Request, res: Response): Promise<any> => {
  try {
    const product = await updateProduct(Number(req.params.id), req.body);
    const actor = (req as RequestWithUser).user;
    if (actor) {
      await recordAuditLog({
        userId: Number(actor.id),
        actorRole: actor.role,
        action: 'PRODUCT_UPDATED',
        entity: 'PRODUCT',
        entityId: product.id,
        details: `${product.name} (${product.sku}) updated`,
        ipAddress: req.ip,
      });
    }
    return res.json({ success: true, data: product });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.status(500).json({ success: false, message: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<any> => {
  try {
    const product = await removeProduct(Number(req.params.id));
    const actor = (req as RequestWithUser).user;
    if (actor) {
      await recordAuditLog({
        userId: Number(actor.id),
        actorRole: actor.role,
        action: 'PRODUCT_DELETED',
        entity: 'PRODUCT',
        entityId: product.id,
        details: `${product.name} (${product.sku}) deleted`,
        ipAddress: req.ip,
      });
    }
    return res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
};

export const getLowStock = async (_req: Request, res: Response): Promise<any> => {
  const data = await getLowStockProducts();
  return res.json({ success: true, data });
};

export const getExpiring = async (req: Request, res: Response): Promise<any> => {
  const days = Number(req.query.days) || 30;
  const data = await getExpiringProducts(days);
  return res.json({ success: true, data });
};

export const getSearchProducts = async (req: Request, res: Response): Promise<any> => {
  const q = String(req.query.q || '').trim();
  if (!q) {
    return res.status(400).json({ success: false, message: 'Search query is required' });
  }
  const data = await searchProducts(q);
  return res.json({ success: true, data });
};

export const getCategories = async (_req: Request, res: Response): Promise<any> => {
  const data = await listCategories();
  return res.json({ success: true, data });
};
