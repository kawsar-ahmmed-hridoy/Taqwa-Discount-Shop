import { getPrismaClient } from '../../config';

const prisma = getPrismaClient();

export const listProducts = async (query: {
  categoryId?: number;
  isActive?: boolean;
  page: number;
  limit: number;
}) => {
  const where: { categoryId?: number; isActive?: boolean } = {};
  if (typeof query.categoryId === 'number') where.categoryId = query.categoryId;
  if (typeof query.isActive === 'boolean') where.isActive = query.isActive;

  const skip = (query.page - 1) * query.limit;
  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    },
  };
};

export const getProduct = async (id: number) => {
  return prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
};

export const createProduct = async (payload: {
  name: string;
  barcode?: string;
  sku: string;
  categoryId: number;
  brand?: string;
  purchasePrice: number;
  sellingPrice: number;
  discount?: number;
  stockQuantity?: number;
  minStockLevel?: number;
  expiryDate?: string;
  isActive?: boolean;
}) => {
  return prisma.product.create({
    data: {
      ...payload,
      expiryDate: payload.expiryDate ? new Date(payload.expiryDate) : null,
      discount: payload.discount ?? 0,
      stockQuantity: payload.stockQuantity ?? 0,
      minStockLevel: payload.minStockLevel ?? 10,
      isActive: payload.isActive ?? true,
    },
    include: { category: true },
  });
};

export const updateProduct = async (
  id: number,
  payload: Partial<{
    name: string;
    barcode: string;
    sku: string;
    categoryId: number;
    brand: string;
    purchasePrice: number;
    sellingPrice: number;
    discount: number;
    stockQuantity: number;
    minStockLevel: number;
    expiryDate: string;
    isActive: boolean;
  }>
) => {
  const data = {
    ...payload,
    expiryDate: payload.expiryDate ? new Date(payload.expiryDate) : payload.expiryDate === null ? null : undefined,
  };

  return prisma.product.update({
    where: { id },
    data,
    include: { category: true },
  });
};

export const removeProduct = async (id: number) => {
  return prisma.product.delete({ where: { id } });
};

export const getLowStockProducts = async () => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: true },
  });

  return products.filter((p) => p.stockQuantity <= p.minStockLevel);
};

export const getExpiringProducts = async (daysAhead: number) => {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + daysAhead);

  return prisma.product.findMany({
    where: {
      isActive: true,
      expiryDate: {
        gte: new Date(),
        lte: endDate,
      },
    },
    include: { category: true },
    orderBy: { expiryDate: 'asc' },
  });
};

export const searchProducts = async (q: string) => {
  return prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: q } },
        { barcode: { contains: q } },
        { sku: { contains: q } },
        { brand: { contains: q } },
      ],
    },
    include: { category: true },
    take: 20,
  });
};

export const listCategories = async () => prisma.category.findMany({ orderBy: { name: 'asc' } });
