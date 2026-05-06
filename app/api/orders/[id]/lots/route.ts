import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  try {
    const lots = await prisma.productionLot.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "asc" },
    })
    return Response.json(lots)
  } catch {
    return Response.json([])
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })
  if (session.role === "USER") return Response.json({ error: "권한이 없습니다." }, { status: 403 })

  const { id } = await params
  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) return Response.json({ error: "발주를 찾을 수 없습니다." }, { status: 404 })

  const body = await req.json()
  if (!body.lotName?.trim()) return Response.json({ error: "조 이름은 필수입니다." }, { status: 400 })

  const lot = await prisma.productionLot.create({
    data: {
      orderId: id,
      lotName: body.lotName.trim(),
      quantity: body.quantity ? Number(body.quantity) : null,
      scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
      completedDate: body.completedDate ? new Date(body.completedDate) : null,
      note: body.note || null,
    },
  })

  await prisma.activity.create({
    data: {
      orderId: id,
      userId: session.userId,
      action: "LOT_ADDED",
      changes: { lotName: lot.lotName, quantity: lot.quantity },
    },
  })

  return Response.json(lot, { status: 201 })
}
