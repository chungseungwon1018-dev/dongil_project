"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isBefore, startOfDay } from "date-fns"
import { ko } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Lot {
  id: string
  lotName: string
  quantity: number | null
  scheduledDate: string | null
  completedDate: string | null
  order: {
    id: string
    orderNumber: string
    clientName: string
    siteName: string | null
    status: string
    deliveryRequestDate: string | null
  }
}

export default function CalendarPage() {
  const router = useRouter()
  const [now] = useState(new Date())
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [lots, setLots] = useState<Lot[]>([])

  useEffect(() => {
    fetch(`/api/calendar?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((d) => setLots(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [year, month])

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const firstDay = new Date(year, month - 1, 1)
  const days = eachDayOfInterval({ start: startOfMonth(firstDay), end: endOfMonth(firstDay) })
  const startPad = getDay(firstDay) // 0=일
  const today = startOfDay(new Date())

  function getLotsForDay(day: Date) {
    return lots.filter((lot) => {
      const d = lot.scheduledDate || lot.completedDate
      return d && isSameDay(new Date(d), day)
    })
  }

  function lotColor(lot: Lot) {
    if (lot.completedDate) return "bg-green-100 text-green-800 border-green-200"
    if (lot.scheduledDate && isBefore(new Date(lot.scheduledDate), today)) return "bg-red-100 text-red-800 border-red-200"
    return "bg-blue-100 text-blue-800 border-blue-200"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">생산 캘린더</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium w-24 text-center">
            {format(new Date(year, month - 1, 1), "yyyy년 M월", { locale: ko })}
          </span>
          <Button variant="outline" size="sm" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* 범례 */}
      <div className="flex gap-3 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-200 inline-block" />예정</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-200 inline-block" />완료</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-200 inline-block" />지연</span>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b">
          {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
            <div key={d} className={`text-center text-xs font-medium py-2 ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-600"}`}>
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7">
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} className="min-h-24 border-b border-r p-1 bg-gray-50" />
          ))}
          {days.map((day, i) => {
            const dayLots = getLotsForDay(day)
            const isToday = isSameDay(day, today)
            const col = (startPad + i) % 7
            return (
              <div key={day.toISOString()} className={`min-h-24 border-b border-r p-1 ${isToday ? "bg-yellow-50" : ""}`}>
                <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday ? "bg-blue-600 text-white" : col === 0 ? "text-red-500" : col === 6 ? "text-blue-500" : "text-gray-700"
                }`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5">
                  {dayLots.map((lot) => (
                    <div
                      key={lot.id}
                      className={`text-xs px-1 py-0.5 rounded border cursor-pointer truncate ${lotColor(lot)}`}
                      title={`${lot.order.clientName} - ${lot.lotName}`}
                      onClick={() => router.push(`/orders/${lot.order.id}`)}
                    >
                      {lot.order.clientName} {lot.lotName}
                      {lot.quantity && <span className="ml-1 opacity-70">{lot.quantity}장</span>}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 이번 달 요약 */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="border rounded-lg p-3 text-center">
          <p className="text-gray-500 text-xs">전체 조</p>
          <p className="text-xl font-bold text-gray-800">{lots.length}</p>
        </div>
        <div className="border rounded-lg p-3 text-center">
          <p className="text-gray-500 text-xs">완료</p>
          <p className="text-xl font-bold text-green-600">{lots.filter(l => l.completedDate).length}</p>
        </div>
        <div className="border rounded-lg p-3 text-center">
          <p className="text-gray-500 text-xs">예정/지연</p>
          <p className="text-xl font-bold text-blue-600">{lots.filter(l => !l.completedDate).length}</p>
        </div>
      </div>
    </div>
  )
}
