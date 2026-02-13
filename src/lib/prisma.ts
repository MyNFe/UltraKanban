import { PrismaClient } from '@prisma/client'

// Neon PostgreSQL connection string
// Used as fallback when DATABASE_URL is not set or is incorrect
const NEON_DATABASE_URL = 'postgresql://neondb_owner:npg_L6TNrvC8oFaq@ep-steep-pine-ai7jhajb-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

// Get DATABASE_URL from environment or use fallback
const getDatabaseUrl = (): string => {
  const envUrl = process.env.DATABASE_URL
  
  // Check if DATABASE_URL is set and is a valid PostgreSQL URL
  if (envUrl && (envUrl.startsWith('postgresql://') || envUrl.startsWith('postgres://'))) {
    return envUrl
  }
  
  // Fallback to Neon URL
  console.log('⚠️ DATABASE_URL not set or invalid, using Neon fallback')
  return NEON_DATABASE_URL
}

const databaseUrl = getDatabaseUrl()

// Global reference for Prisma Client (prevents multiple instances in development)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma Client instance
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
})

// Save reference in development to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
