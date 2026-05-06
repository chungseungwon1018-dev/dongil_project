import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })
  if (session.role === "USER") return Response.json({ error: "권한이 없습니다." }, { status: 403 })

  const { id } = await params
  const client = await prisma.client.findUnique({ where: { id } })
  if (!client) return Response.json({ error: "거래처를 찾을 수 없습니다." }, { status: 404 })

  const body = await req.json()
  if (body.name?.trim()) {
    const dup = await prisma.client.findFirst({ where: { name: body.name.trim(), NOT: { id } } })
    if (dup) return Response.json({ error: "이미 등록된 업체명입니다." }, { status: 409 })
  }

  const updated = await prisma.client.update({
    where: { id },
    data: {
      name: body.name?.trim() ?? client.name,
      shortCode: body.shortCode !== undefined ? (body.shortCode?.trim() || null) : client.shortCode,
      phone: body.phone !== undefined ? (body.phone?.trim() || null) : client.phone,
      memo: body.memo !== undefined ? (body.memo?.trim() || null) : client.memo,
    },
  })

  return Response.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })
  if (session.role !== "ADMIN") return Response.json({ error: "관리자만 삭제 가능합니다." }, { status: 403 })

  const { id } = await params
  const client = await prisma.client.findUnique({ where: { id } })
  if (!client) return Response.json({ error: "거래처를 찾을 수 없습니다." }, { status: 404 })

  const orderCount = await prisma.order.count({ where: { clientId: id } })
  if (orderCount > 0) {
    return Response.json({ error: `연결된 발주 ${orderCount}건이 있어 삭제할 수 없습니다.` }, { status: 400 })
  }

  await prisma.client.delete({ where: { id } })
  return Response.json({ ok: true })
}
