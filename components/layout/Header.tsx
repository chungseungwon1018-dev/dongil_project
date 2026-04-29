"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"

interface HeaderProps {
  fullName: string
  role: string
}

const roleLabel: Record<string, string> = {
  ADMIN: "관리자",
  MANAGER: "매니저",
  USER: "사용자",
}

export function Header({ fullName, role }: HeaderProps) {
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/auth/login")
    router.refresh()
    toast.success("로그아웃 되었습니다.")
  }

  return (
    <header className="h-12 border-b bg-white flex items-center justify-between px-4">
      <div />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <User className="h-4 w-4" />
          <span>{fullName}</span>
          <span className="text-xs text-gray-400">({roleLabel[role]})</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
          <LogOut className="h-4 w-4" />
          로그아웃
        </Button>
      </div>
    </header>
  )
}
