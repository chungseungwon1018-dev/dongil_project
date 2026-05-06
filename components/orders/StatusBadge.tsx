import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type OrderStatus = "WAITING" | "PRODUCTION" | "PRODUCTION_DONE" | "SHIPPED" | "HOLD" | "DELAYED"

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  WAITING: { label: "대기", className: "bg-gray-100 text-gray-700 hover:bg-gray-100" },
  PRODUCTION: { label: "생산중", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  PRODUCTION_DONE: { label: "생산완료", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  SHIPPED: { label: "출고완료", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  HOLD: { label: "보류", className: "bg-red-100 text-red-700 hover:bg-red-100" },
  DELAYED: { label: "지연", className: "bg-red-50 text-red-600 hover:bg-red-50 font-semibold" },
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status] ?? statusConfig.WAITING
  return <Badge className={cn("font-medium text-xs", config.className)}>{config.label}</Badge>
}

export { statusConfig }
