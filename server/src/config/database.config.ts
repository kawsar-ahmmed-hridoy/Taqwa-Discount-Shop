import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;

export const getPrismaClient = (): PrismaClient => {
  if (!prismaInstance) {
    // Ensure DATABASE_URL is present for Prisma. If not provided, try to build it from DB_* vars.
    if (!process.env.DATABASE_URL) {
      const host = process.env.DB_HOST;
      const user = process.env.DB_USER;
      const password = process.env.DB_PASSWORD;
      const dbName = process.env.DB_NAME;
      const port = process.env.DB_PORT;

      if (host && user && password && dbName) {
        const encodedPassword = encodeURIComponent(password);
        const portSegment = port ? `:${port}` : '';
        process.env.DATABASE_URL = `mysql://${user}:${encodedPassword}@${host}${portSegment}/${dbName}`;
        console.log('DATABASE_URL constructed from DB_* env vars');
      } else {
        console.warn('DATABASE_URL is not set and DB_* vars are incomplete. Prisma may fail to connect.');
      }
    }

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
