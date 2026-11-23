// One shared database connection (Prisma client) for the whole app.
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

// In development Next.js reloads files often; reuse the same client.
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
