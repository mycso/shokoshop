import { Body, Container, Head, Heading, Html, Img, Preview, Text } from "@react-email/components";
import type { Order } from "@/types";
import { OrderSummary, logoUrl } from "./shared";

export function OrderConfirmationEmail({ order }: { order: Order }) {
  return (
    <Html>
      <Head />
      <Preview>Your ShokoShop order {order.id} is confirmed</Preview>
      <Body style={{ backgroundColor: "#f9fafb", fontFamily: "sans-serif" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "16px", maxWidth: "480px" }}>
          <Img src={logoUrl()} width="36" height="36" alt="ShokoShop" />
          <Heading style={{ fontSize: "22px", color: "#111827" }}>Thank you, {order.customerName}!</Heading>
          <Text style={{ color: "#4b5563", fontSize: "15px", lineHeight: "24px" }}>
            Your order has been received and is being prepared for fulfilment.
          </Text>
          <Text style={{ color: "#9ca3af", fontSize: "13px", fontFamily: "monospace" }}>{order.id}</Text>

          <OrderSummary order={order} />
        </Container>
      </Body>
    </Html>
  );
}

export default OrderConfirmationEmail;
