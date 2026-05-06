"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/orders/StatusBadge"

const GLASS_LABELS: Record<string, string> = {
  TPS: "TPS", LAMINATED: "접합", TRIPLE: "3복층", SINGLE: "단판", OTHER: "기타",
}

interface Order {
  id: string
  orderNumber: string
  siteName: string | null
  quantity: number | null
  area: string | null
  glassType: string | null
  status: string
  deliveryRequestDate: string | null
  createdAt: string
}

interface Client {
  id: string
  name: string
  shortCode: string | null
  phone: string | null
  memo: string | null
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [id, setId] = useState("")

  useEffect(() => {
    params.then(({ id }) => {
      setId(id)
      fetch(`/api/clients/${id}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.client) setClient(d.client)
          if (d.orders) setOrders(d.orders)
        })
        .catch(() => {})
    })
  }, [params])

  if (!client) return <div className="text-sm text-gray-400 p-4">불러오는 중...</div>

  const totalQty = orders.reduce((s, o) => s + (o.quantity ?? 0), 0)
  const shippedCount = orders.filter(o => o.status === "SHIPPED").length
  const glassTypes = orders.reduce<Record<string, number>>((acc, o) => {
    if (o.glassType) acc[o.glassType] = (acc[o.glassType] ?? 0) + 1
    return acc
  }, {})
  const topGlass = Object.entries(glassTypes).sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />목록
        </Button>
        <h2 className="text-lg font-semibold flex-1">{client.name}</h2>
        {client.shortCode && <span className="text-xs text-gray-400 border px-2 py-0.5 rounded">{client.shortCode}</span>}
      </div>

      {/* 거래처 정보 */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">거래처 정보</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2"><span className="w-20 text-gray-500">전화번호</span><span>{client.phone || "-"}</span></div>
            <div className="flex gap-2"><span className="w-20 text-gray-500">메모</span><span>{client.memo || "-"}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">거래 통계</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-500">총 발주</p>
              <p className="text-2xl font-bold text-blue-600">{orders.length}건</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">총 수량</p>
              <p className="text-2xl font-bold text-gray-800">{totalQty.toLocaleString()}장</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">완료 건수</p>
              <p className="text-2xl font-bold text-green-600">{shippedCount}건</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">자주 쓰는 유리</p>
              <p className="text-sm font-bold text-gray-800">{topGlass[0] ? GLASS_LABELS[topGlass[0][0]] ?? topGlass[0][0] : "-"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 발주 이력 */}
      <Card>
        <CardHeader><CardTitle className="text-sm">발주 이력 ({orders.length}건)</CardTitle></CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-gray-400">발주 이력이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center gap-3 text-sm border rounded-md px-3 py-2 hover:bg-gray-50">
                  <Link href={`/orders/${o.id}`} className="text-blue-600 hover:underline font-medium w-20 shrink-0">
                    {o.orderNumber}
                  </Link>
                  <span className="text-gray-700 flex-1">{o.siteName || "-"}</span>
                  {o.quantity && <span className="text-gray-500 text-xs">{o.quantity}장</span>}
                  {o.glassType && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                      {GLASS_LABELS[o.glassType] ?? o.glassType}
                    </span>
                  )}
                  {o.deliveryRequestDate && (
                    <span className="text-xs text-gray-400">납품 {format(new Date(o.deliveryRequestDate), "MM.dd")}</span>
                  )}
                  <StatusBadge status={o.status as any} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
