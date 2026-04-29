import { getSession, deleteSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
  const session = await getSession()
  if (session) {
    await prisma.activity.create({
      data: { userId: session.userId, action: "USER_LOGOUT" },
    })
  }
  await deleteSession()
  return Response.json({ ok: true })
}
