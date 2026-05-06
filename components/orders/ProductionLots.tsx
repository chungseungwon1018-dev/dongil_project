"use client"

import { useState, useEffect, Dispatch, SetStateAction } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react"

interface Lot {
  id: string
  lotName: string
  quantity: number | null
  scheduledDate: string | null
  completedDate: string | null
  note: string | null
}

interface Props {
  orderId: string
  role: string
}

function fmt(d: string | null) {
  if (!d) return "-"
  return format(new Date(d), "MM.dd")
}

export function ProductionLots({ orderId, role }: Props) {
  const [lots, setLots] = useState<Lot[]>([])
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ lotName: "", quantity: "", scheduledDate: "", completedDate: "", note: "" })

  useEffect(() => {
    fetch(`/api/orders/${orderId}/lots`)
      .then((r) => r.json())
      .then((d) => setLots(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [orderId])

  function resetForm() {
    setForm({ lotName: "", quantity: "", scheduledDate: "", completedDate: "", note: "" })
    setAdding(false)
    setEditId(null)
  }

  async function handleAdd() {
    if (!form.lotName.trim()) { toast.error("조 이름을 입력하세요."); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/lots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lotName: form.lotName,
          quantity: form.quantity ? Number(form.quantity) : null,
          scheduledDate: form.scheduledDate || null,
          completedDate: form.completedDate || null,
          note: form.note || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setLots((prev) => [...prev, data])
      toast.success("조가 추가되었습니다.")
      resetForm()
    } catch { toast.error("오류가 발생했습니다.") }
    finally { setSaving(false) }
  }

  async function handleEdit(id: string) {
    if (!form.lotName.trim()) { toast.error("조 이름을 입력하세요."); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/lots/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lotName: form.lotName,
          quantity: form.quantity ? Number(form.quantity) : null,
          scheduledDate: form.scheduledDate || null,
          completedDate: form.completedDate || null,
          note: form.note || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setLots((prev) => prev.map((l) => l.id === id ? data : l))
      toast.success("수정되었습니다.")
      resetForm()
    } catch { toast.error("오류가 발생했습니다.") }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string, lotName: string) {
    if (!confirm(`[${lotName}] 조를 삭제하시겠습니까?`)) return
    const res = await fetch(`/api/lots/${id}`, { method: "DELETE" })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    setLots((prev) => prev.filter((l) => l.id !== id))
    toast.success("삭제되었습니다.")
  }

  async function toggleComplete(lot: Lot) {
    const completedDate = lot.completedDate ? null : new Date().toISOString().split("T")[0]
    const res = await fetch(`/api/lots/${lot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completedDate }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    setLots((prev) => prev.map((l) => l.id === lot.id ? data : l))
  }

  function startEdit(lot: Lot) {
    setEditId(lot.id)
    setAdding(false)
    setForm({
      lotName: lot.lotName,
      quantity: lot.quantity?.toString() ?? "",
      scheduledDate: lot.scheduledDate ? lot.scheduledDate.split("T")[0] : "",
      completedDate: lot.completedDate ? lot.completedDate.split("T")[0] : "",
      note: lot.note ?? "",
    })
  }

  const canEdit = role !== "USER"

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm">생산 조(Lot) 배치</CardTitle>
        {canEdit && !adding && !editId && (
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => { setAdding(true); setEditId(null) }}>
            <Plus className="h-3 w-3" /> 조 추가
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {lots.length === 0 && !adding && (
          <p className="text-sm text-gray-400">등록된 생산 조가 없습니다.</p>
        )}

        {lots.map((lot) => (
          <div key={lot.id} className={`rounded-md border px-3 py-2 text-sm ${lot.completedDate ? "bg-green-50 border-green-200" : "bg-white"}`}>
            {editId === lot.id ? (
              <LotForm
                form={form}
                setForm={setForm}
                onSave={() => handleEdit(lot.id)}
                onCancel={resetForm}
                saving={saving}
                label="수정"
              />
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => canEdit && toggleComplete(lot)}
                  className={canEdit ? "cursor-pointer" : "cursor-default"}
                  title={lot.completedDate ? "완료 취소" : "완료 처리"}
                >
                  {lot.completedDate
                    ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                    : <Circle className="h-4 w-4 text-gray-400" />}
                </button>
                <span className={`font-medium flex-1 ${lot.completedDate ? "line-through text-gray-500" : ""}`}>
                  {lot.lotName}
                </span>
                {lot.quantity != null && (
                  <span className="text-gray-500 text-xs">{lot.quantity}장</span>
                )}
                {lot.scheduledDate && (
                  <span className="text-gray-500 text-xs">예정: {fmt(lot.scheduledDate)}</span>
                )}
                {lot.completedDate && (
                  <span className="text-green-600 text-xs">완료: {fmt(lot.completedDate)}</span>
                )}
                {lot.note && (
                  <span className="text-gray-400 text-xs truncate max-w-24">{lot.note}</span>
                )}
                {canEdit && (
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => startEdit(lot)}>수정</Button>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-red-500" onClick={() => handleDelete(lot.id, lot.lotName)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {adding && (
          <div className="rounded-md border px-3 py-3 bg-blue-50">
            <LotForm
              form={form}
              setForm={setForm}
              onSave={handleAdd}
              onCancel={resetForm}
              saving={saving}
              label="추가"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

type LotFormState = { lotName: string; quantity: string; scheduledDate: string; completedDate: string; note: string }

function LotForm({
  form, setForm, onSave, onCancel, saving, label,
}: {
  form: LotFormState
  setForm: Dispatch<SetStateAction<LotFormState>>
  onSave: () => void
  onCancel: () => void
  saving: boolean
  label: string
}) {
  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">조 이름 *</Label>
          <Input
            value={form.lotName}
            onChange={(e) => set("lotName", e.target.value)}
            placeholder="예: 7/25 53조"
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">수량</Label>
          <Input
            type="number"
            min="0"
            value={form.quantity}
            onChange={(e) => set("quantity", e.target.value)}
            placeholder="0"
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">예정일</Label>
          <Input type="date" value={form.scheduledDate} onChange={(e) => set("scheduledDate", e.target.value)} className="h-7 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">완료일</Label>
          <Input type="date" value={form.completedDate} onChange={(e) => set("completedDate", e.target.value)} className="h-7 text-xs" />
        </div>
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">비고</Label>
          <Input value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="메모" className="h-7 text-xs" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" size="sm" className="h-7 text-xs" onClick={onSave} disabled={saving}>{label}</Button>
        <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel}>취소</Button>
      </div>
    </div>
  )
}
