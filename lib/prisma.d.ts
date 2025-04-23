// lib/prisma.d.ts
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

declare module '@/lib/prisma' {
  export const prisma: PrismaClient;
}