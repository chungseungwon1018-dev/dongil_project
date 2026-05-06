import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

async function generateOrderNumber(): Promise<string> {
  const yy = String(new Date().getFullYear()).slice(-2)
  const last = await prisma.order.findFirst({
    where: { orderNumber: { startsWith: `${yy}-` } },
    orderBy: { orderNumber: "desc" },
  })
  if (!last) return `${yy}-0001`
  const seq = parseInt(last.orderNumber.split("-")[1] ?? "0", 10)
  return `${yy}-${String(seq + 1).padStart(4, "0")}`
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const status = searchParams.get("status")
  const clientName = searchParams.get("clientName")
  const search = searchParams.get("search")
  const dateFrom = searchParams.get("dateFrom")
  const dateTo = searchParams.get("dateTo")
  const page = Math.max(1, Number(searchParams.get("page") || 1))
  const limit = Math.min(100, Number(searchParams.get("limit") || 50))

  const where: Record<string, unknown> = {}
  if (status && status !== "ALL") where.status = status
  if (clientName) where.clientName = { contains: clientName }
  if (search) {
    where.OR = [
      { orderNumber: { contains: search } },
      { clientName: { contains: search } },
      { siteName: { contains: search } },
    ]
  }
  if (dateFrom || dateTo) {
    where.deliveryRequestDate = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    }
  }

  const [data, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { createdBy: { select: { fullName: true } } },
    }),
    prisma.order.count({ where }),
  ])

  return Response.json({ data, total, page, limit })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()

    const orderNumber = await generateOrderNumber()

    const order = await prisma.order.create({
      data: {
        orderNumber,
        clientName: body.clientName,
        clientId: body.clientId || null,
        siteName: body.siteName || null,
        quantity: body.quantity ? Number(body.quantity) : null,
        area: body.area ? Number(body.area) : null,
        frameType: body.frameType || null,
        glassType: body.glassType || null,
        productName: body.productName || null,
        noteDefect: body.noteDefect || null,
        noteJoint: body.noteJoint || null,
        orderReceivedDate: body.orderReceivedDate ? new Date(body.orderReceivedDate) : null,
        productionRequestDate: body.productionRequestDate ? new Date(body.productionRequestDate) : null,
        deliveryRequestDate: body.deliveryRequestDate ? new Date(body.deliveryRequestDate) : null,
        createdById: session.userId,
      },
    })

    await prisma.activity.create({
      data: { orderId: order.id, userId: session.userId, action: "ORDER_CREATED" },
    })

    return Response.json(order, { status: 201 })
  } catch (e) {
    console.error(e)
    return Response.json({ error: "서버 오류" }, { status: 500 })
  }
}
