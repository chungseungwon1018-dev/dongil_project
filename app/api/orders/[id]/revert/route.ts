import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

// 되돌리기 규칙: 현재 상태 → 이전 상태
const revertMap: Record<string, { prev: string; clearField: string }> = {
  PRODUCTION: { prev: "WAITING", clearField: "productionDate" },
  PRODUCTION_DONE: { prev: "PRODUCTION", clearField: "productionDate" },
  SHIPPED: { prev: "PRODUCTION_DONE", clearField: "shipmentDate" },
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  // 관리자(ADMIN, MANAGER)만 되돌리기 가능
  if (session.role === "USER") {
    return Response.json({ error: "관리자만 상태를 되돌릴 수 있습니다." }, { status: 403 })
  }

  const { id } = await params
  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) return Response.json({ error: "발주를 찾을 수 없습니다." }, { status: 404 })

  const rule = revertMap[order.status]
  if (!rule) {
    return Response.json({ error: "대기 상태에서는 더 이상 되돌릴 수 없습니다." }, { status: 400 })
  }

  const { reason } = await req.json()

  // 되돌리기 시 해당 날짜를 되돌린 날짜(오늘)로 설정
  const today = new Date()
  const updateData: Record<string, unknown> = {
    status: rule.prev,
    [rule.clearField]: today,
  }

  const updated = await prisma.order.update({
    where: { id },
    data: updateData,
  })

  await prisma.activity.create({
    data: {
      orderId: id,
      userId: session.userId,
      action: "STATUS_REVERTED",
      changes: { from: order.status, to: rule.prev },
      reason: reason || null,
    },
  })

  return Response.json(updated)
}
