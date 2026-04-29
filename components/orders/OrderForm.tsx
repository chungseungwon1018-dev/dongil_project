"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface OrderData {
  id?: string
  orderNumber?: string
  clientName?: string
  siteName?: string
  quantity?: number | null
  area?: string | number | null
  frameType?: string
  productName?: string
  noteDefect?: string
  noteJoint?: string
  orderReceivedDate?: string | null
  productionRequestDate?: string | null
  deliveryRequestDate?: string | null
}

interface OrderFormProps {
  initialData?: OrderData
  mode: "create" | "edit"
}

function toDateInput(val: string | null | undefined): string {
  if (!val) return ""
  return val.split("T")[0]
}

function genOrderNumber() {
  const yy = String(new Date().getFullYear()).slice(-2)
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, "0")
  return `${yy}-${rand}`
}

export function OrderForm({ initialData, mode }: OrderFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    orderNumber: initialData?.orderNumber || genOrderNumber(),
    clientName: initialData?.clientName || "",
    siteName: initialData?.siteName || "",
    quantity: initialData?.quantity?.toString() || "",
    area: initialData?.area?.toString() || "",
    frameType: initialData?.frameType || "",
    productName: initialData?.productName || "",
    noteDefect: initialData?.noteDefect || "",
    noteJoint: initialData?.noteJoint || "",
    orderReceivedDate: toDateInput(initialData?.orderReceivedDate),
    productionRequestDate: toDateInput(initialData?.productionRequestDate),
    deliveryRequestDate: toDateInput(initialData?.deliveryRequestDate),
  })

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.clientName.trim()) {
      toast.error("업체명은 필수입니다.")
      return
    }
    if (form.quantity && Number(form.quantity) < 0) {
      toast.error("수량은 0 이상이어야 합니다.")
      return
    }
    if (form.area && Number(form.area) < 0) {
      toast.error("면적은 0 이상이어야 합니다.")
      return
    }

    setLoading(true)
    try {
      const url = mode === "create" ? "/api/orders" : `/api/orders/${initialData?.id}`
      const method = mode === "create" ? "POST" : "PATCH"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity: form.quantity ? Number(form.quantity) : null,
          area: form.area ? form.area : null,
          orderReceivedDate: form.orderReceivedDate || null,
          productionRequestDate: form.productionRequestDate || null,
          deliveryRequestDate: form.deliveryRequestDate || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "오류가 발생했습니다.")
        return
      }
      toast.success(mode === "create" ? "발주가 등록되었습니다." : "발주가 수정되었습니다.")
      router.push(`/orders/${data.id}`)
      router.refresh()
    } catch {
      toast.error("서버 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">
      <Card>
        <CardHeader><CardTitle className="text-base">기본 정보</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>의뢰번호</Label>
            <Input value={form.orderNumber} readOnly className="bg-gray-50" />
          </div>
          <div className="space-y-1">
            <Label>업체명 *</Label>
            <Input value={form.clientName} onChange={(e) => set("clientName", e.target.value)} placeholder="업체명" required />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>현장명</Label>
            <Input value={form.siteName} onChange={(e) => set("siteName", e.target.value)} placeholder="현장명" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">사양 정보</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-4 gap-4">
          <div className="space-y-1">
            <Label>수량</Label>
            <Input type="number" min="0" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1">
            <Label>면적</Label>
            <Input type="number" min="0" step="0.01" value={form.area} onChange={(e) => set("area", e.target.value)} placeholder="0.00" />
          </div>
          <div className="space-y-1">
            <Label>간봉</Label>
            <Input value={form.frameType} onChange={(e) => set("frameType", e.target.value)} placeholder="간봉" />
          </div>
          <div className="space-y-1">
            <Label>품명</Label>
            <Input value={form.productName} onChange={(e) => set("productName", e.target.value)} placeholder="품명" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">일정</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label>주문서도착일</Label>
            <Input type="date" value={form.orderReceivedDate} onChange={(e) => set("orderReceivedDate", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>생산의뢰일</Label>
            <Input type="date" value={form.productionRequestDate} onChange={(e) => set("productionRequestDate", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>납품요청일</Label>
            <Input type="date" value={form.deliveryRequestDate} onChange={(e) => set("deliveryRequestDate", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">비고</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>비고 (하자외)</Label>
            <Textarea value={form.noteDefect} onChange={(e) => set("noteDefect", e.target.value)} rows={2} placeholder="하자외 비고사항" />
          </div>
          <div className="space-y-1">
            <Label>비고 (접합, 3복층)</Label>
            <Textarea value={form.noteJoint} onChange={(e) => set("noteJoint", e.target.value)} rows={2} placeholder="접합, 3복층 비고사항" />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "저장 중..." : mode === "create" ? "등록" : "수정"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>취소</Button>
      </div>
    </form>
  )
}
