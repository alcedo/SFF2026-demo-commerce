import { notFound, redirect } from "next/navigation";
import { loadPublicOrder } from "@/lib/order-view";
import { CheckoutView } from "./checkout-view";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await loadPublicOrder(orderId);
  if (!order) notFound();
  if (order.status === "paid") {
    redirect(`/processing/${order.id}`);
  }
  return <CheckoutView order={order} />;
}
