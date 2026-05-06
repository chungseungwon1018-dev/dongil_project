"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, X, Check } from "lucide-react"

interface Client {
  id: string
  name: string
  shortCode: string | null
  phone: string | null
  memo: string | null
}

function emptyForm() {
  return { name: "", shortCode: "", phone: "", memo: "" }
}

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState("")
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  async function load() {
    const r = await fetch(`/api/clients?search=${encodeURIComponent(search)}&limit=200`)
    const d = await r.json()
    setClients(d.data ?? [])
  }

  useEffect(() => { load() }, [search])

  function set(k: string, v: string) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  async function handleAdd() {
    if (!form.name.trim()) { toast.error("업체명은 필수입니다."); return }
    setSaving(true)
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success("거래처가 등록되었습니다.")
      setAdding(false)
      setForm(emptyForm())
      load()
    } catch { toast.error("오류가 발생했습니다.") }
    finally { setSaving(false) }
  }

  async function handleEdit(id: string) {
    if (!form.name.trim()) { toast.error("업체명은 필수입니다."); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success("수정되었습니다.")
      setEditId(null)
      setForm(emptyForm())
      load()
    } catch { toast.error("오류가 발생했습니다.") }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`[${name}]을(를) 삭제하시겠습니까?`)) return
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    toast.success("삭제되었습니다.")
    load()
  }

  function startEdit(c: Client) {
    setEditId(c.id)
    setAdding(false)
    setForm({ name: c.name, shortCode: c.shortCode ?? "", phone: c.phone ?? "", memo: c.memo ?? "" })
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">거래처 관리</h2>
        {!adding && (
          <Button size="sm" className="gap-1" onClick={() => { setAdding(true); setEditId(null); setForm(emptyForm()) }}>
            <Plus className="h-4 w-4" /> 거래처 추가
          </Button>
        )}
      </div>

      {adding && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader><CardTitle className="text-sm">새 거래처 등록</CardTitle></CardHeader>
          <CardContent>
            <ClientFormFields form={form} set={set} />
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleAdd} disabled={saving}>등록</Button>
              <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setForm(emptyForm()) }}>취소</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-4 space-y-3">
          <Input
            placeholder="업체명 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>업체명</TableHead>
                  <TableHead>코드</TableHead>
                  <TableHead>전화번호</TableHead>
                  <TableHead>메모</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                      등록된 거래처가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
                {clients.map((c) => (
                  <TableRow key={c.id}>
                    {editId === c.id ? (
                      <TableCell colSpan={4}>
                        <ClientFormFields form={form} set={set} inline />
                      </TableCell>
                    ) : (
                      <>
                        <TableCell className="font-medium cursor-pointer text-blue-600 hover:underline" onClick={() => router.push(`/clients/${c.id}`)}>{c.name}</TableCell>
                        <TableCell className="text-gray-500 text-sm">{c.shortCode || "-"}</TableCell>
                        <TableCell className="text-sm">{c.phone || "-"}</TableCell>
                        <TableCell className="text-sm text-gray-500 max-w-48 truncate">{c.memo || "-"}</TableCell>
                      </>
                    )}
                    <TableCell>
                      {editId === c.id ? (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleEdit(c.id)} disabled={saving}>
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditId(null)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => startEdit(c)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-red-500" onClick={() => handleDelete(c.id, c.name)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-gray-400">{clients.length}개 거래처</p>
        </CardContent>
      </Card>
    </div>
  )
}

function ClientFormFields({
  form, set, inline = false,
}: {
  form: { name: string; shortCode: string; phone: string; memo: string }
  set: (k: string, v: string) => void
  inline?: boolean
}) {
  return (
    <div className={`grid gap-2 ${inline ? "grid-cols-4" : "grid-cols-2"}`}>
      <div className="space-y-1">
        <Label className="text-xs">업체명 *</Label>
        <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="업체명" className="h-8 text-sm" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">코드</Label>
        <Input value={form.shortCode} onChange={(e) => set("shortCode", e.target.value)} placeholder="예: a, g" className="h-8 text-sm" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">전화번호</Label>
        <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="010-0000-0000" className="h-8 text-sm" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">메모</Label>
        <Input value={form.memo} onChange={(e) => set("memo", e.target.value)} placeholder="메모" className="h-8 text-sm" />
      </div>
    </div>
  )
}
