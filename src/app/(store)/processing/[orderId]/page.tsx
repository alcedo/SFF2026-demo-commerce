import { notFound, redirect } from "next/navigation";
import { loadPublicOrder } from "@/lib/order-view";
import { ProcessingView } from "./processing-view";

export default async function ProcessingPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await loadPublicOrder(orderId);
  if (!order) notFound();
  if (order.status !== "paid") {
    redirect(`/checkout/${order.id}`);
  }
  return <ProcessingView orderId={order.id} />;
}
