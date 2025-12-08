import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('owner123', 10);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@pos.com' },
    update: {},
    create: {
      email: 'owner@pos.com',
      password: hashedPassword,
      fullName: 'John Owner',
      role: UserRole.OWNER,
    },
  });

  const managerPassword = await bcrypt.hash('manager123', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@pos.com' },
    update: {},
    create: {
      email: 'manager@pos.com',
      password: managerPassword,
      fullName: 'Sarah Manager',
      role: UserRole.MANAGER,
    },
  });

  const staffPassword = await bcrypt.hash('staff123', 10);
  const staff = await prisma.user.upsert({
    where: { email: 'staff@pos.com' },
    update: {},
    create: {
      email: 'staff@pos.com',
      password: staffPassword,
      fullName: 'Mike Staff',
      role: UserRole.STAFF,
    },
  });

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Electronics' },
      update: {},
      create: { name: 'Electronics' },
    }),
    prisma.category.upsert({
      where: { name: 'Groceries' },
      update: {},
      create: { name: 'Groceries' },
    }),
    prisma.category.upsert({
      where: { name: 'Beverages' },
      update: {},
      create: { name: 'Beverages' },
    }),
    prisma.category.upsert({
      where: { name: 'Snacks' },
      update: {},
      create: { name: 'Snacks' },
    }),
  ]);

  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'PRD001' },
      update: {},
      create: {
        name: 'Wireless Mouse',
        barcode: '1234567890123',
        sku: 'PRD001',
        categoryId: categories[0].id,
        brand: 'Logitech',
        purchasePrice: 15.00,
        sellingPrice: 25.00,
        stockQuantity: 50,
        minStockLevel: 10,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'PRD002' },
      update: {},
      create: {
        name: 'USB Cable',
        barcode: '1234567890124',
        sku: 'PRD002',
        categoryId: categories[0].id,
        brand: 'Generic',
        purchasePrice: 3.00,
        sellingPrice: 7.00,
        stockQuantity: 100,
        minStockLevel: 20,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'PRD003' },
      update: {},
      create: {
        name: 'Rice 1kg',
        barcode: '1234567890125',
        sku: 'PRD003',
        categoryId: categories[1].id,
        brand: 'Golden Harvest',
        purchasePrice: 2.00,
        sellingPrice: 3.50,
        stockQuantity: 200,
        minStockLevel: 50,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'PRD004' },
      update: {},
      create: {
        name: 'Coca Cola 500ml',
        barcode: '1234567890126',
        sku: 'PRD004',
        categoryId: categories[2].id,
        brand: 'Coca Cola',
        purchasePrice: 0.80,
        sellingPrice: 1.50,
        stockQuantity: 150,
        minStockLevel: 30,
        expiryDate: new Date('2025-12-31'),
      },
    }),
  ]);

  const suppliers = await Promise.all([
    prisma.supplier.upsert({
      where: { phone: '+1234567890' },
      update: {},
      create: {
        name: 'Tech Supplies Inc',
        contactPerson: 'David Tech',
        phone: '+1234567890',
        email: 'david@techsupplies.com',
        address: '123 Tech Street, Silicon Valley',
      },
    }),
    prisma.supplier.upsert({
      where: { phone: '+1234567891' },
      update: {},
      create: {
        name: 'Food Distributors Ltd',
        contactPerson: 'Emily Food',
        phone: '+1234567891',
        email: 'emily@fooddist.com',
        address: '456 Market Road, New York',
      },
    }),
  ]);

  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { phone: '+8801712345678' },
      update: {},
      create: {
        name: 'Alice Johnson',
        phone: '+8801712345678',
        email: 'alice@email.com',
        address: '789 Customer Lane',
        loyaltyPoints: 100,
      },
    }),
    prisma.customer.upsert({
      where: { phone: '+8801712345679' },
      update: {},
      create: {
        name: 'Bob Smith',
        phone: '+8801712345679',
        email: 'bob@email.com',
        address: '321 Buyer Street',
        loyaltyPoints: 50,
      },
    }),
  ]);

  await prisma.settings.upsert({
    where: { key: 'vat_rate' },
    update: {},
    create: { key: 'vat_rate', value: '5' },
  });

  await prisma.settings.upsert({
    where: { key: 'currency' },
    update: {},
    create: { key: 'currency', value: 'BDT' },
  });

  await prisma.settings.upsert({
    where: { key: 'loyalty_points_rate' },
    update: {},
    create: { key: 'loyalty_points_rate', value: '1' },
  });

  console.log('Database seeded successfully!');
  console.log('\nLogin Credentials:');
  console.log('Owner: owner@pos.com / owner123');
  console.log('Manager: manager@pos.com / manager123');
  console.log('Staff: staff@pos.com / staff123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });