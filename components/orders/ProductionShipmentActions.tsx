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
import { Undo2 } from "lucide-react"

interface Props {
  orderId: string
  status: OrderStatus
  role: string
}

const revertLabels: Partial<Record<OrderStatus, string>> = {
  PRODUCTION: "대기 상태로 되돌리기",
  PRODUCTION_DONE: "생산중 상태로 되돌리기",
  SHIPPED: "생산완료 상태로 되돌리기",
}

export function ProductionShipmentActions({ orderId, status, role }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const today = format(new Date(), "yyyy-MM-dd")
  const [prodDate, setProdDate] = useState(today)
  const [shipDate, setShipDate] = useState(today)
  const [showRevert, setShowRevert] = useState(false)
  const [revertReason, setRevertReason] = useState("")

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

  async function handleRevert() {
    if (!revertReason.trim()) {
      toast.error("되돌리기 사유를 입력해주세요.")
      return
    }
    if (!confirm("정말 이전 단계로 되돌리시겠습니까?")) return

    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/revert`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: revertReason }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success("이전 단계로 되돌렸습니다.")
      setShowRevert(false)
      setRevertReason("")
      router.refresh()
    } catch { toast.error("오류가 발생했습니다.") }
    finally { setLoading(false) }
  }

  const canRevert = status !== "WAITING" && status !== "HOLD"

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">생산 / 출고 처리</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-6">
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
        </div>

        {/* 되돌리기 영역 */}
        {canRevert && (
          <div className="border-t pt-4">
            {!showRevert ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRevert(true)}
                className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 gap-1"
              >
                <Undo2 className="h-4 w-4" />
                {revertLabels[status] || "이전 단계로 되돌리기"}
              </Button>
            ) : (
              <div className="space-y-3 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-medium text-red-700">
                  ⚠ {revertLabels[status]}
                </p>
                <div className="space-y-1">
                  <Label className="text-xs text-red-600">사유 (필수)</Label>
                  <Input
                    value={revertReason}
                    onChange={(e) => setRevertReason(e.target.value)}
                    placeholder="되돌리기 사유를 입력하세요..."
                    className="border-red-300 focus:border-red-500"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleRevert}
                    disabled={loading}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    확인
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setShowRevert(false); setRevertReason("") }}
                    disabled={loading}
                  >
                    취소
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
