import { after, NextRequest, NextResponse } from "next/server";
import { getOrder } from "@/lib/db";
import { toPublicOrder } from "@/lib/order-view";
import { detectAndFulfill } from "@/lib/payment";

const scanning = new Set<string>();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Do not await Sepolia getLogs here — checkout first paint must show pending UI.
  if (order.status === "pending" && !scanning.has(id)) {
    scanning.add(id);
    after(async () => {
      try {
        const latest = getOrder(id);
        if (latest) await detectAndFulfill(latest);
      } finally {
        scanning.delete(id);
      }
    });
  }

  return NextResponse.json({ order: toPublicOrder(order) });
}
