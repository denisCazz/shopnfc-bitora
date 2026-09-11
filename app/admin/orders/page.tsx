import { getOrders } from "@/app/admin/actions/orders";
import OrdersClient from "./OrdersClient";

export default async function OrdersPage() {
  const { orders, profileMap } = await getOrders();

  return <OrdersClient initialOrders={orders} profileMap={profileMap} />;
}
