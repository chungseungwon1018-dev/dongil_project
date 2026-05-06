import { PrismaClient } from "./generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

type GlobalForPrisma = { prisma: PrismaClient; pgPool: pg.Pool }
const g = globalThis as unknown as GlobalForPrisma

if (!g.pgPool) {
  g.pgPool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, max: 5 })
}

if (!g.prisma) {
  const adapter = new PrismaPg(g.pgPool)
  g.prisma = new PrismaClient({ adapter })
}

export const prisma = g.prisma
