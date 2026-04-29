import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AdminUsersClient } from "./AdminUsersClient"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") redirect("/orders")

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, username: true, fullName: true, department: true,
      phone: true, role: true, status: true, lastLoginAt: true, createdAt: true,
    },
  })

  const serialized = users.map((u) => ({
    ...u,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  }))

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">사용자 관리</h2>
      <AdminUsersClient users={serialized} currentUserId={session.userId} />
    </div>
  )
}
