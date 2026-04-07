import { PrismaClient } from "@prisma/client/edge"
import { withAccelerate } from "@prisma/extension-accelerate"

type PrismaClientWithExtensions = ReturnType<PrismaClient["$extends"]>

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClientWithExtensions | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  }).$extends(withAccelerate())
}

function getPrismaClient() {
  if (!global.prisma) {
    global.prisma = createPrismaClient()
  }

  return global.prisma
}

export const prisma = new Proxy({} as PrismaClientWithExtensions, {
  get(_target, prop) {
    const client = getPrismaClient()
    const value = client[prop as keyof PrismaClientWithExtensions]

    if (typeof value === "function") {
      return value.bind(client)
    }

    return value
  },
}) as PrismaClientWithExtensions
