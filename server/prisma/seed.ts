import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('owner123', 10);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@taqwa.com' },
    update: {},
    create: {
      email: 'owner@taqwa.com',
      password: hashedPassword,
      fullName: 'Kawsar Ahmmed Hridoy',
      role: UserRole.OWNER,
    },
  });

  const managerPassword = await bcrypt.hash('manager123', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@taqwa.com' },
    update: {},
    create: {
      email: 'manager@taqwa.com',
      password: managerPassword,
      fullName: 'Maria Tasnia',
      role: UserRole.MANAGER,
    },
  });

  const staffPassword = await bcrypt.hash('staff123', 10);
  const staff = await prisma.user.upsert({
    where: { email: 'staff@taqwa.com' },
    update: {},
    create: {
      email: 'staff@taqwa.com',
      password: staffPassword,
      fullName: 'Minhajul Islam Borson',
      role: UserRole.STAFF,
    },
  });

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Cosmetics' },
      update: {},
      create: { name: 'Cosmetics' },
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
        name: 'Face Wash',
        barcode: '1234567890123',
        sku: 'PRD001',
        categoryId: categories[0].id,
        brand: 'Himalaya',
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
        name: 'Face Cream',
        barcode: '1234567890124',
        sku: 'PRD002',
        categoryId: categories[0].id,
        brand: 'Fair & Lovely',
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
      where: { phone: '+8801234567890' },
      update: {},
      create: {
        name: 'Hasan Cosmetics Supplies',
        contactPerson: 'Farida Hasan',
        phone: '+8801234567890',
        email: 'hasan@cosmetics.com',
        address: 'Karwan Bazar, Dhaka',
      },
    }),
    prisma.supplier.upsert({
      where: { phone: '+8801234567891' },
      update: {},
      create: {
        name: 'Food Distributors Ltd',
        contactPerson: 'Rahim Food',
        phone: '+8801234567891',
        email: 'rahim@fooddist.com',
        address: 'Banani, Dhaka',
      },
    }),
  ]);

  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { phone: '+8801712345678' },
      update: {},
      create: {
        name: 'Akij Food Ltd',
        phone: '+8801712345678',
        email: 'akij@food.com',
        address: 'Baridhara, Dhaka',
        loyaltyPoints: 100,
      },
    }),
    prisma.customer.upsert({
      where: { phone: '+8801712345679' },
      update: {},
      create: {
        name: 'Fazal Food Ltd',
        phone: '+8801712345679',
        email: 'fazal@food.com',
        address: 'Gulshan, Dhaka',
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
  console.log('Owner: owner@taqwa.com / owner123');
  console.log('Manager: manager@taqwa.com / manager123');
  console.log('Staff: staff@taqwa.com / staff123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });