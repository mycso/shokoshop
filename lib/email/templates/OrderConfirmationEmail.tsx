import { Text } from "@react-email/components";
import type { Order } from "@/types";
import { EmailHeading, EmailLayout, OrderSummary } from "./shared";

export function OrderConfirmationEmail({ order }: { order: Order }) {
  return (
    <EmailLayout
      preview={`Your ShokoShop order ${order.id} is confirmed`}
      footerNote="You're receiving this because you placed an order with ShokoShop."
    >
      <EmailHeading>{`Thank you, ${order.customerName}!`}</EmailHeading>
      <Text style={{ color: "#4b5563", fontSize: "15px", lineHeight: "24px", margin: 0 }}>
        Your order has been received and is being prepared for fulfilment.
      </Text>
      <Text style={{ color: "#9ca3af", fontSize: "13px", fontFamily: "monospace", margin: "8px 0 0" }}>
        {order.id}
      </Text>

      <OrderSummary order={order} />
    </EmailLayout>
  );
}

export default OrderConfirmationEmail;
