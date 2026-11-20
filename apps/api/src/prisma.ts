import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export function resolveDatabaseUrl(): string | undefined {
  const raw =
    process.env.DATABASE_URL_POOLED ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL;
  if (!raw) return undefined;

  try {
    const parsed = new URL(raw);
    if (!parsed.searchParams.has('schema')) {
      parsed.searchParams.set('schema', 'appointo');
    }
    return parsed.toString();
  } catch {
    return raw;
  }
}

const databaseUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(
    databaseUrl
      ? {
          datasources: {
            db: { url: databaseUrl },
          },
        }
      : undefined
  );

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
