import { OrderForm } from "@/components/orders/OrderForm"

export default function NewOrderPage() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">발주 등록</h2>
      <OrderForm mode="create" />
    </div>
  )
}
