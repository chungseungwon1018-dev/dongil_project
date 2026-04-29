import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

const PUBLIC_PATHS = ["/auth/login", "/auth/register"]
const API_PUBLIC = ["/api/auth/login", "/api/auth/register"]

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  const isApiPublic = API_PUBLIC.some((p) => pathname.startsWith(p))

  if (isPublic || isApiPublic) return NextResponse.next()

  const token = req.cookies.get("dongil-session")?.value
  const session = token ? await verifyToken(token) : null

  if (!session) {
    const loginUrl = new URL("/auth/login", req.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname.startsWith("/admin") && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/orders", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
