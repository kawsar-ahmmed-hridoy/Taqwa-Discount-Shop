import { getPrismaClient } from '../../config';

const prisma = getPrismaClient();

export const getSettings = async () => {
  const rows = await prisma.settings.findMany();
  return rows.reduce<Record<string, string>>((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
};

export const updateSettings = async (payload: Record<string, unknown>) => {
  const updates = Object.entries(payload).map(([key, value]) =>
    prisma.settings.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    })
  );

  await Promise.all(updates);
};
