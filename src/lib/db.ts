import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Initialize Prisma Client with error handling
function createPrismaClient() {
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
  } catch (error) {
    console.error('Failed to create Prisma Client:', error)
    throw error
  }
}

export const db =
  globalForPrisma.prisma ??
  createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Test database connection on startup
if (process.env.NODE_ENV === 'development') {
  db.$connect()
    .then(() => {
      console.log('✓ Database connected successfully')
    })
    .catch((error) => {
      console.error('✗ Database connection failed:', error)
      console.error('Please check your DATABASE_URL in .env file')
    })
}