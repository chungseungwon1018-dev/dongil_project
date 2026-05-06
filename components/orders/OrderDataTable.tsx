"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ColumnDef, SortingState, flexRender, getCoreRowModel,
  getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge, type OrderStatus } from "./StatusBadge"
import { format, isThisWeek, isBefore, startOfDay } from "date-fns"
import { ChevronUp, ChevronDown, Plus } from "lucide-react"

interface Order {
  id: string
  orderNumber: string
  clientName: string
  siteName: string | null
  quantity: number | null
  area: string | null
  frameType: string | null
  productName: string | null
  deliveryRequestDate: string | null
  productionDate: string | null
  shipmentDate: string | null
  status: OrderStatus
  createdBy: { fullName: string }
  createdAt: string
}

interface Props {
  initialData: Order[]
}

function fmt(val: string | null | undefined) {
  if (!val) return "-"
  return format(new Date(val), "MM.dd")
}

export function OrderDataTable({ initialData }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<Order[]>(initialData)
  const [sorting, setSorting] = useState<SortingState>([])
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState(searchParams?.get("status") || "ALL")
  const [quickFilter, setQuickFilter] = useState(searchParams?.get("quickFilter") || "ALL")

  // 검색어 디바운스 (300ms) — 매 키 입력마다 재렌더 방지
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(value), 300)
  }, [])
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const deleteOrder = useCallback(async (id: string, orderNumber: string) => {
    if (!confirm(`[${orderNumber}] 발주를 삭제하시겠습니까?`)) return
    const res = await fetch(`/api/orders/${id}`, { method: "DELETE" })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error || "삭제 실패")
      return
    }
    toast.success("삭제되었습니다.")
    setData((prev) => prev.filter((o) => o.id !== id))
  }, [])

  // today를 메모이제이션하여 매 렌더마다 새 Date 객체 생성 방지
  const today = useMemo(() => startOfDay(new Date()), [])

  const filtered = useMemo(() => {
    return data.filter((o) => {
      const matchSearch =
        !search ||
        o.orderNumber.includes(search) ||
        o.clientName.includes(search) ||
        (o.siteName || "").includes(search)
      const matchStatus = 
        statusFilter === "ALL" 
          ? true 
          : statusFilter === "IN_PROGRESS"
            ? !["SHIPPED", "HOLD"].includes(o.status)
            : o.status === statusFilter
            
      let matchQuick = true
      if (quickFilter === "THIS_WEEK") {
        matchQuick = !!o.deliveryRequestDate && isThisWeek(new Date(o.deliveryRequestDate), { weekStartsOn: 1 })
      } else if (quickFilter === "DELAYED") {
        matchQuick =
          !!o.deliveryRequestDate &&
          isBefore(new Date(o.deliveryRequestDate), today) &&
          o.status !== "SHIPPED"
      }
      return matchSearch && matchStatus && matchQuick
    })
  }, [data, search, statusFilter, quickFilter, today])

  // columns를 메모이제이션하여 테이블 재초기화 방지
  const columns: ColumnDef<Order>[] = useMemo(() => [
    {
      accessorKey: "orderNumber",
      header: "의뢰번호",
      cell: ({ row }) => (
        <Link href={`/orders/${row.original.id}`} className="text-blue-600 hover:underline font-medium">
          {row.original.orderNumber}
        </Link>
      ),
    },
    { accessorKey: "clientName", header: "업체명" },
    {
      accessorKey: "siteName",
      header: "현장명",
      cell: ({ row }) => row.original.siteName || "-",
    },
    {
      accessorKey: "quantity",
      header: "수량",
      cell: ({ row }) => row.original.quantity ?? "-",
    },
    {
      accessorKey: "area",
      header: "면적",
      cell: ({ row }) => row.original.area ?? "-",
    },
    {
      accessorKey: "frameType",
      header: "간봉",
      cell: ({ row }) => row.original.frameType || "-",
    },
    {
      accessorKey: "productName",
      header: "품명",
      cell: ({ row }) => row.original.productName || "-",
    },
    {
      accessorKey: "orderReceivedDate",
      header: "주문서도착",
      cell: ({ row }) => fmt((row.original as any).orderReceivedDate),
    },
    {
      accessorKey: "productionRequestDate",
      header: "생산의뢰",
      cell: ({ row }) => fmt((row.original as any).productionRequestDate),
    },
    {
      accessorKey: "deliveryRequestDate",
      header: "납품요청",
      cell: ({ row }) => {
        const date = row.original.deliveryRequestDate
        if (!date) return "-"
        const isDelayed = isBefore(new Date(date), today) && row.original.status !== "SHIPPED"
        return <span className={isDelayed ? "text-red-600 font-medium" : ""}>{fmt(date)}</span>
      },
    },
    {
      accessorKey: "productionDate",
      header: "생산",
      cell: ({ row }) => fmt(row.original.productionDate),
    },
    {
      accessorKey: "shipmentDate",
      header: "출고",
      cell: ({ row }) => fmt(row.original.shipmentDate),
    },
    {
      accessorKey: "status",
      header: "상태",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            variant="ghost" size="sm"
            onClick={() => router.push(`/orders/${row.original.id}/edit`)}
            disabled={row.original.status === "SHIPPED"}
          >
            수정
          </Button>
          <Button
            variant="ghost" size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={() => deleteOrder(row.original.id, row.original.orderNumber)}
            disabled={row.original.status !== "WAITING"}
          >
            삭제
          </Button>
        </div>
      ),
    },
  ], [router, deleteOrder, today])

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 30 } },
  })

  return (
    <div className="space-y-3">
      {/* 필터 */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 font-medium">검색</span>
          <Input
            placeholder="의뢰번호, 업체명, 현장명 검색..."
            value={searchInput}
            onChange={handleSearchChange}
            className="w-64"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 font-medium">상태</span>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "ALL")}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="전체 상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체</SelectItem>
              <SelectItem value="IN_PROGRESS">진행중</SelectItem>
              <SelectItem value="WAITING">대기</SelectItem>
              <SelectItem value="PRODUCTION">생산중</SelectItem>
              <SelectItem value="PRODUCTION_DONE">생산완료</SelectItem>
              <SelectItem value="SHIPPED">출고완료</SelectItem>
              <SelectItem value="HOLD">보류</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 font-medium">조건</span>
          <Select value={quickFilter} onValueChange={(v) => setQuickFilter(v ?? "ALL")}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="빠른 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체</SelectItem>
              <SelectItem value="THIS_WEEK">이번 주 납품</SelectItem>
              <SelectItem value="DELAYED">지연 중인 발주</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length}건</span>
        <Link href="/orders/new">
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> 발주 등록
          </Button>
        </Link>
      </div>

      {/* 테이블 */}
      <div className="border rounded-lg overflow-x-auto bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-xs whitespace-nowrap cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc" && <ChevronUp className="h-3 w-3" />}
                      {header.column.getIsSorted() === "desc" && <ChevronDown className="h-3 w-3" />}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-sm py-2 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-gray-400">
                  데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          {table.getState().pagination.pageIndex + 1} / {Math.max(1, table.getPageCount())} 페이지
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            이전
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            다음
          </Button>
        </div>
      </div>
    </div>
  )
}
