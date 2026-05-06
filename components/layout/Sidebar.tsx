"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ClipboardList, LayoutDashboard, Users, Building2 } from "lucide-react"

const navItems = [
  { href: "/orders", label: "발주 목록", icon: ClipboardList },
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/clients", label: "거래처 관리", icon: Building2 },
]

const adminItems = [{ href: "/admin/users", label: "사용자 관리", icon: Users }]

interface SidebarProps {
  role: string
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-52 shrink-0 border-r bg-white flex flex-col min-h-screen">
      <div className="px-4 py-5 border-b">
        <h1 className="text-base font-bold text-gray-900">동일유리</h1>
        <p className="text-xs text-gray-500 mt-0.5">생산관리 시스템</p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname.startsWith(href)
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
        {role === "ADMIN" && (
          <>
            <div className="pt-3 pb-1 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              관리자
            </div>
            {adminItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname.startsWith(href)
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </>
        )}
      </nav>
    </aside>
  )
}
