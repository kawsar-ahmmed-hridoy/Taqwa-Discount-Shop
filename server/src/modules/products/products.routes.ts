import { Router } from 'express';
import {
	getProducts,
	getProductById,
	postProduct,
	putProduct,
	deleteProduct,
	getLowStock,
	getExpiring,
	getSearchProducts,
	getCategories,
} from './products.controller';
import { authenticate, authorize } from '../../middleware';

const router = Router();

router.use(authenticate);

router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/low-stock', getLowStock);
router.get('/expiring', getExpiring);
router.get('/search', getSearchProducts);
router.get('/:id', getProductById);

router.post('/', authorize('OWNER', 'MANAGER'), postProduct);
router.put('/:id', authorize('OWNER', 'MANAGER'), putProduct);
router.delete('/:id', authorize('OWNER'), deleteProduct);

export default router;
