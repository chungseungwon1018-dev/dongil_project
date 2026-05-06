import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const search = searchParams.get("search")
  const limit = Math.min(200, Number(searchParams.get("limit") || 100))

  const where = search
    ? { name: { contains: search } }
    : {}

  try {
    const [data, total] = await Promise.all([
      prisma.client.findMany({ where, orderBy: { name: "asc" }, take: limit }),
      prisma.client.count({ where }),
    ])
    return Response.json({ data, total })
  } catch {
    return Response.json({ data: [], total: 0 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })
  if (session.role === "USER") return Response.json({ error: "권한이 없습니다." }, { status: 403 })

  const body = await req.json()
  if (!body.name?.trim()) return Response.json({ error: "업체명은 필수입니다." }, { status: 400 })

  const exists = await prisma.client.findUnique({ where: { name: body.name.trim() } })
  if (exists) return Response.json({ error: "이미 등록된 업체명입니다." }, { status: 409 })

  const client = await prisma.client.create({
    data: {
      name: body.name.trim(),
      shortCode: body.shortCode?.trim() || null,
      phone: body.phone?.trim() || null,
      memo: body.memo?.trim() || null,
    },
  })

  return Response.json(client, { status: 201 })
}
