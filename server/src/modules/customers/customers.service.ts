import { getPrismaClient } from '../../config';

const prisma = getPrismaClient();

export const listCustomers = async (query: { search?: string; page: number; limit: number }) => {
  const where: {
    OR?: Array<{ name?: { contains: string }; phone?: { contains: string }; email?: { contains: string } }>;
  } = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search } },
      { phone: { contains: query.search } },
      { email: { contains: query.search } },
    ];
  }

  const skip = (query.page - 1) * query.limit;
  const [data, total] = await Promise.all([
    prisma.customer.findMany({ where, skip, take: query.limit, orderBy: { createdAt: 'desc' } }),
    prisma.customer.count({ where }),
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


export const createCustomer = async (payload: {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}) => prisma.customer.create({ data: payload });


export const updateCustomer = async (id: number, payload: Partial<{ name: string; phone: string; email: string; address: string }>) =>
  prisma.customer.update({ where: { id }, data: payload });

export const getCustomerHistory = async (id: number) =>
  prisma.sale.findMany({
    where: { customerId: id },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  });
