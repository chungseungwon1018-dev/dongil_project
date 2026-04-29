"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { OrderStatus } from "./StatusBadge"
import { format } from "date-fns"

interface Props {
  orderId: string
  status: OrderStatus
  role: string
}

export function ProductionShipmentActions({ orderId, status, role }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const today = format(new Date(), "yyyy-MM-dd")
  const [prodDate, setProdDate] = useState(today)
  const [shipDate, setShipDate] = useState(today)

  if (status === "SHIPPED") return null
  if (role === "USER") return null

  async function handleProduction() {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/production`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productionDate: prodDate }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success("생산 등록되었습니다.")
      router.refresh()
    } catch { toast.error("오류가 발생했습니다.") }
    finally { setLoading(false) }
  }

  async function handleShipment() {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/shipment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipmentDate: shipDate }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success("출고 등록되었습니다.")
      router.refresh()
    } catch { toast.error("오류가 발생했습니다.") }
    finally { setLoading(false) }
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">생산 / 출고 처리</CardTitle></CardHeader>
      <CardContent className="flex flex-wrap gap-6">
        {status === "WAITING" && (
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <Label className="text-xs">생산일</Label>
              <Input type="date" value={prodDate} onChange={(e) => setProdDate(e.target.value)} className="w-36" />
            </div>
            <Button onClick={handleProduction} disabled={loading} className="bg-yellow-500 hover:bg-yellow-600 text-white">
              생산 등록
            </Button>
          </div>
        )}
        {(status === "PRODUCTION" || status === "PRODUCTION_DONE") && (
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <Label className="text-xs">출고일</Label>
              <Input type="date" value={shipDate} onChange={(e) => setShipDate(e.target.value)} className="w-36" />
            </div>
            <Button onClick={handleShipment} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
              출고 등록
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
