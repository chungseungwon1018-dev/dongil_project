import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { startOfMonth, endOfMonth } from "date-fns"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const year = Number(searchParams.get("year") || new Date().getFullYear())
  const month = Number(searchParams.get("month") || new Date().getMonth() + 1)

  const from = startOfMonth(new Date(year, month - 1, 1))
  const to = endOfMonth(new Date(year, month - 1, 1))

  try {
    const lots = await prisma.productionLot.findMany({
      where: {
        OR: [
          { scheduledDate: { gte: from, lte: to } },
          { completedDate: { gte: from, lte: to } },
        ],
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            clientName: true,
            siteName: true,
            status: true,
            deliveryRequestDate: true,
          },
        },
      },
      orderBy: { scheduledDate: "asc" },
    })
    return Response.json(lots)
  } catch {
    return Response.json([])
  }
}
