import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { OrderForm } from "@/components/orders/OrderForm"

export const dynamic = "force-dynamic"

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) notFound()
  if (order.status === "SHIPPED") redirect(`/orders/${id}`)

  const serialized = {
    ...order,
    area: order.area?.toString() ?? null,
    orderReceivedDate: order.orderReceivedDate?.toISOString() ?? null,
    productionRequestDate: order.productionRequestDate?.toISOString() ?? null,
    deliveryRequestDate: order.deliveryRequestDate?.toISOString() ?? null,
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">발주 수정 — {order.orderNumber}</h2>
      <OrderForm mode="edit" initialData={serialized as any} />
    </div>
  )
}
