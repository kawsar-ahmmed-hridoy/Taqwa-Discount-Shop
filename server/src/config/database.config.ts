import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;

export const getPrismaClient = (): PrismaClient => {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return prismaInstance;
};


export const connectDatabase = async (): Promise<void> => {
  try {
    const prisma = getPrismaClient();
    await prisma.$connect();
    console.log('Prisma connected to mysql database');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
    console.log('✅ Prisma disconnected from mysql database');
  }
};


export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
};

export default getPrismaClient;
