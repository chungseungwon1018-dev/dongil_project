import { NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { username, password, fullName, department, phone } = await req.json()

    if (!username || !password || !fullName) {
      return Response.json({ error: "필수 항목을 입력해주세요." }, { status: 400 })
    }
    if (password.length < 6) {
      return Response.json({ error: "비밀번호는 6자 이상이어야 합니다." }, { status: 400 })
    }

    const exists = await prisma.user.findUnique({ where: { username } })
    if (exists) {
      return Response.json({ error: "이미 사용 중인 아이디입니다." }, { status: 400 })
    }

    const userCount = await prisma.user.count()
    // 첫 번째 사용자는 자동으로 ADMIN + ACTIVE
    const isFirst = userCount === 0

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        fullName,
        department,
        phone,
        role: isFirst ? "ADMIN" : "USER",
        status: isFirst ? "ACTIVE" : "PENDING",
      },
    })

    await prisma.activity.create({
      data: { userId: user.id, action: "USER_CREATED" },
    })

    return Response.json({
      ok: true,
      message: isFirst
        ? "관리자 계정이 생성되었습니다."
        : "가입 신청이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.",
    })
  } catch (e) {
    console.error(e)
    return Response.json({ error: "서버 오류" }, { status: 500 })
  }
}
