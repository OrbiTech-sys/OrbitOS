import type { Metadata } from "next";

import { OrdersView } from "@/components/demo/orders/orders-view";
import { ModuleGate } from "@/components/demo/ui";

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <ModuleGate module="orders" name="Orders">
      <OrdersView />
    </ModuleGate>
  );
}
