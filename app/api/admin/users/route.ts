import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 })

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, username: true, fullName: true, department: true,
      phone: true, role: true, status: true, lastLoginAt: true, createdAt: true,
    },
  })
  return Response.json(users)
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 })

  const { userId, action, role } = await req.json()

  if (action === "approve") {
    await prisma.user.update({ where: { id: userId }, data: { status: "ACTIVE" } })
  } else if (action === "reject" || action === "deactivate") {
    await prisma.user.update({ where: { id: userId }, data: { status: "INACTIVE" } })
  } else if (action === "changeRole" && role) {
    await prisma.user.update({ where: { id: userId }, data: { role } })
    await prisma.activity.create({
      data: { userId: session.userId, action: "USER_PERMISSION_CHANGED", changes: { targetUserId: userId, newRole: role } },
    })
  }

  return Response.json({ ok: true })
}
