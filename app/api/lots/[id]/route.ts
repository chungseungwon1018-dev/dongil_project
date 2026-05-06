import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })
  if (session.role === "USER") return Response.json({ error: "권한이 없습니다." }, { status: 403 })

  const { id } = await params
  const lot = await prisma.productionLot.findUnique({ where: { id } })
  if (!lot) return Response.json({ error: "조를 찾을 수 없습니다." }, { status: 404 })

  const body = await req.json()
  const updated = await prisma.productionLot.update({
    where: { id },
    data: {
      lotName: body.lotName?.trim() ?? lot.lotName,
      quantity: body.quantity !== undefined ? (body.quantity ? Number(body.quantity) : null) : lot.quantity,
      scheduledDate: body.scheduledDate !== undefined
        ? (body.scheduledDate ? new Date(body.scheduledDate) : null)
        : lot.scheduledDate,
      completedDate: body.completedDate !== undefined
        ? (body.completedDate ? new Date(body.completedDate) : null)
        : lot.completedDate,
      note: body.note !== undefined ? (body.note || null) : lot.note,
    },
  })

  await prisma.activity.create({
    data: {
      orderId: lot.orderId,
      userId: session.userId,
      action: "LOT_UPDATED",
      changes: { lotId: id, lotName: updated.lotName },
    },
  })

  return Response.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })
  if (session.role === "USER") return Response.json({ error: "권한이 없습니다." }, { status: 403 })

  const { id } = await params
  const lot = await prisma.productionLot.findUnique({ where: { id } })
  if (!lot) return Response.json({ error: "조를 찾을 수 없습니다." }, { status: 404 })

  await prisma.activity.create({
    data: {
      orderId: lot.orderId,
      userId: session.userId,
      action: "LOT_DELETED",
      changes: { lotName: lot.lotName },
    },
  })

  await prisma.productionLot.delete({ where: { id } })
  return Response.json({ ok: true })
}
