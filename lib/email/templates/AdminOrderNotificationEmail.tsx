import { Text } from "@react-email/components";
import type { Order } from "@/types";
import { EmailHeading, EmailLayout, OrderSummary } from "./shared";

export function AdminOrderNotificationEmail({ order }: { order: Order }) {
  return (
    <EmailLayout preview={`New order ${order.id} — ${order.customerName}`} footerNote="Internal notification — sent to the store admin inbox.">
      <EmailHeading>New order received</EmailHeading>
      <Text style={{ color: "#4b5563", fontSize: "15px", lineHeight: "24px", margin: 0 }}>
        {`${order.customerName} (${order.customerEmail}) just placed an order.`}
      </Text>
      <Text style={{ color: "#9ca3af", fontSize: "13px", fontFamily: "monospace", margin: "8px 0 0" }}>
        {order.id}
      </Text>

      <OrderSummary order={order} />
    </EmailLayout>
  );
}

export default AdminOrderNotificationEmail;
