import { NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { createSession } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return Response.json({ error: "아이디와 비밀번호를 입력해주세요." }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { username } })

    if (!user) {
      return Response.json({ error: "아이디 또는 비밀번호가 잘못되었습니다." }, { status: 401 })
    }

    // 계정 잠금 확인
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return Response.json({ error: "계정이 잠겼습니다. 잠시 후 다시 시도해주세요." }, { status: 403 })
    }

    // 계정 상태 확인
    if (user.status === "PENDING") {
      return Response.json({ error: "관리자 승인 대기 중입니다." }, { status: 403 })
    }
    if (user.status === "INACTIVE") {
      return Response.json({ error: "비활성화된 계정입니다." }, { status: 403 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)

    if (!valid) {
      const failedLogins = user.failedLogins + 1
      const lockedUntil = failedLogins >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLogins, lockedUntil },
      })
      return Response.json(
        { error: failedLogins >= 5 ? "5회 실패로 계정이 30분 잠깁니다." : "아이디 또는 비밀번호가 잘못되었습니다." },
        { status: 401 }
      )
    }

    // 로그인 성공 — 실패 카운트 초기화
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
    })

    await prisma.activity.create({
      data: {
        userId: user.id,
        action: "USER_LOGIN",
        ipAddress: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown",
      },
    })

    await createSession({
      userId: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    })

    return Response.json({ ok: true, role: user.role })
  } catch (e) {
    console.error(e)
    return Response.json({ error: "서버 오류" }, { status: 500 })
  }
}
