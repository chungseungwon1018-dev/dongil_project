import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/orders/StatusBadge"
import { format, isThisWeek, isBefore, startOfDay } from "date-fns"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true, orderNumber: true, clientName: true, siteName: true,
        status: true, deliveryRequestDate: true, createdAt: true,
      },
    }),
    prisma.order.count(),
  ])

  const today = startOfDay(new Date())
  const inProgress = orders.filter((o) => !["SHIPPED", "HOLD"].includes(o.status)).length
  const thisWeek = orders.filter(
    (o) => o.deliveryRequestDate && isThisWeek(new Date(o.deliveryRequestDate), { weekStartsOn: 1 })
  ).length
  const delayed = orders.filter(
    (o) =>
      o.deliveryRequestDate &&
      isBefore(new Date(o.deliveryRequestDate), today) &&
      o.status !== "SHIPPED"
  ).length
  const shipped = orders.filter((o) => o.status === "SHIPPED").length
  const completionRate = total > 0 ? Math.round((shipped / total) * 100) : 0

  const statusCounts = {
    WAITING: orders.filter((o) => o.status === "WAITING").length,
    PRODUCTION: orders.filter((o) => o.status === "PRODUCTION").length,
    PRODUCTION_DONE: orders.filter((o) => o.status === "PRODUCTION_DONE").length,
    SHIPPED: shipped,
    HOLD: orders.filter((o) => o.status === "HOLD").length,
  }

  const recentDelayed = orders
    .filter(
      (o) =>
        o.deliveryRequestDate &&
        isBefore(new Date(o.deliveryRequestDate), today) &&
        o.status !== "SHIPPED"
    )
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">대시보드</h2>

      {/* KPI 카드 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "진행 중인 발주", value: inProgress, color: "text-blue-600" },
          { label: "이번 주 납품", value: thisWeek, color: "text-green-600" },
          { label: "지연 건수", value: delayed, color: "text-red-600" },
          { label: "완료율", value: `${completionRate}%`, color: "text-gray-700" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-500">{label}</p>
              <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 상태 분포 */}
      <Card>
        <CardHeader><CardTitle className="text-sm">상태별 현황</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center gap-2">
                <StatusBadge status={status as any} />
                <span className="text-sm font-semibold">{count}건</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex h-4 rounded-full overflow-hidden gap-0.5">
            {Object.entries(statusCounts).map(([status, count]) => {
              if (count === 0 || total === 0) return null
              const pct = (count / total) * 100
              const colors: Record<string, string> = {
                WAITING: "bg-gray-300",
                PRODUCTION: "bg-yellow-400",
                PRODUCTION_DONE: "bg-blue-400",
                SHIPPED: "bg-green-500",
                HOLD: "bg-red-400",
              }
              return (
                <div
                  key={status}
                  className={`${colors[status]} transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${status}: ${count}건`}
                />
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 지연 발주 목록 */}
      {recentDelayed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-red-600">⚠ 지연 발주</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recentDelayed.map((o) => (
                <li key={o.id} className="flex items-center gap-3 text-sm">
                  <Link href={`/orders/${o.id}`} className="text-blue-600 hover:underline font-medium w-20">
                    {o.orderNumber}
                  </Link>
                  <span className="text-gray-700 flex-1">{o.clientName}</span>
                  {o.siteName && <span className="text-gray-500 text-xs">{o.siteName}</span>}
                  <span className="text-red-600 text-xs">
                    납품: {format(new Date(o.deliveryRequestDate!), "MM.dd")}
                  </span>
                  <StatusBadge status={o.status as any} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
