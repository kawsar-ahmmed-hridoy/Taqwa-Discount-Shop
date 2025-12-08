import { Router } from 'express';
import { body } from 'express-validator';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getExpiringProducts,
  searchProducts,
} from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', getProducts);
router.get('/low-stock', getLowStockProducts);
router.get('/expiring', getExpiringProducts);
router.get('/search', searchProducts);
router.get('/:id', getProductById);

router.post(
  '/',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  [
    body('name').notEmpty().withMessage('Product name is required'),
    body('sku').notEmpty().withMessage('SKU is required'),
    body('categoryId').isInt().withMessage('Valid category ID is required'),
    body('purchasePrice').isFloat({ min: 0 }).withMessage('Valid purchase price is required'),
    body('sellingPrice').isFloat({ min: 0 }).withMessage('Valid selling price is required'),
  ],
  createProduct
);

router.put(
  '/:id',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  updateProduct
);

router.delete(
  '/:id',
  authorize(UserRole.OWNER),
  deleteProduct
);

export default router;