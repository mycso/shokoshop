import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import type { Order } from "@/types";
import { OrderSummary } from "./shared";

export function AdminOrderNotificationEmail({ order }: { order: Order }) {
  return (
    <Html>
      <Head />
      <Preview>New order {order.id} — {order.customerName}</Preview>
      <Body style={{ backgroundColor: "#f9fafb", fontFamily: "sans-serif" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "16px", maxWidth: "480px" }}>
          <Heading style={{ fontSize: "22px", color: "#111827" }}>New order received</Heading>
          <Text style={{ color: "#4b5563", fontSize: "15px", lineHeight: "24px" }}>
            {order.customerName} ({order.customerEmail}) just placed an order.
          </Text>
          <Text style={{ color: "#9ca3af", fontSize: "13px", fontFamily: "monospace" }}>{order.id}</Text>

          <OrderSummary order={order} />
        </Container>
      </Body>
    </Html>
  );
}

export default AdminOrderNotificationEmail;
