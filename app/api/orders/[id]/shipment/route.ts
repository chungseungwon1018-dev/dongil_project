import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) return Response.json({ error: "발주를 찾을 수 없습니다." }, { status: 404 })

  if (!["PRODUCTION", "PRODUCTION_DONE"].includes(order.status)) {
    return Response.json({ error: "생산중 또는 생산완료 상태에서만 출고 등록이 가능합니다." }, { status: 400 })
  }

  const { shipmentDate } = await req.json()

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: "SHIPPED",
      shipmentDate: shipmentDate ? new Date(shipmentDate) : new Date(),
    },
  })

  await prisma.activity.create({
    data: {
      orderId: id,
      userId: session.userId,
      action: "SHIPMENT_COMPLETED",
      changes: { from: order.status, to: "SHIPPED" },
    },
  })

  return Response.json(updated)
}
