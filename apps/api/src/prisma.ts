import path from 'node:path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load env vars for local dev (checks apps/api/.env and monorepo root .env; never overrides existing env vars)
if (!process.env.VERCEL) {
  dotenv.config();
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
  dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export function resolveDatabaseUrl(): string | undefined {
  const raw =
    process.env.DATABASE_URL_POOLED ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.PRISMA_DATABASE_URL;
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
if (databaseUrl && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl;
}

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
