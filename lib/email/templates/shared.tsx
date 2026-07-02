import { Column, Hr, Row, Section, Text } from "@react-email/components";
import type { Order, ReturnReason, ReturnRequest, ReturnResolution } from "@/types";

export const RETURN_REASON_LABELS: Record<ReturnReason, string> = {
  damaged: "Item arrived damaged",
  wrong_item: "Received the wrong item",
  not_as_described: "Not as described",
  changed_mind: "Changed my mind",
  other: "Other",
};

export const RETURN_RESOLUTION_LABELS: Record<ReturnResolution, string> = {
  refund: "Full refund",
  exchange: "Exchange for same item",
  store_credit: "Store credit",
};

export const BRAND = "#52a9ff";
export const BRAND_DARK = "#1a8ff5";
export const BRAND_LIGHT = "#e8f4ff";

export function logoUrl(): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  return `${base}/shokoshoplogo.svg`;
}

export function baseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
}

export function money(pence: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

export function OrderSummary({ order }: { order: Order }) {
  return (
    <>
      <Hr style={{ borderColor: "#e5e7eb", margin: "20px 0" }} />

      {order.items.map((item) => (
        <Row key={item.id} style={{ marginBottom: "12px" }}>
          <Column>
            <Text style={{ margin: 0, color: "#111827", fontSize: "14px" }}>
              {item.name}
              {item.variantName ? ` — ${item.variantName}` : ""} × {item.quantity}
            </Text>
          </Column>
          <Column align="right">
            <Text style={{ margin: 0, color: "#111827", fontSize: "14px" }}>
              {money(item.price * item.quantity)}
            </Text>
          </Column>
        </Row>
      ))}

      <Hr style={{ borderColor: "#e5e7eb", margin: "20px 0" }} />

      <Row>
        <Column>
          <Text style={{ margin: 0, fontWeight: 600, color: "#111827" }}>Total</Text>
        </Column>
        <Column align="right">
          <Text style={{ margin: 0, fontWeight: 600, color: "#111827" }}>{money(order.total)}</Text>
        </Column>
      </Row>

      <Section style={{ marginTop: "24px" }}>
        <Text style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>Shipping to</Text>
        <Text style={{ color: "#111827", fontSize: "14px", margin: "4px 0 0" }}>
          {order.shippingAddress.name}
          <br />
          {order.shippingAddress.line1}
          {order.shippingAddress.line2 ? <>, {order.shippingAddress.line2}</> : null}
          <br />
          {order.shippingAddress.city}, {order.shippingAddress.postalCode}
          <br />
          {order.shippingAddress.country}
        </Text>
      </Section>
    </>
  );
}

export function ReturnSummary({ returnRequest }: { returnRequest: ReturnRequest }) {
  return (
    <>
      <Hr style={{ borderColor: "#e5e7eb", margin: "20px 0" }} />

      {returnRequest.items.map((item) => (
        <Text key={item.itemId} style={{ margin: "0 0 4px", color: "#111827", fontSize: "14px" }}>
          {item.name} × {item.quantity}
        </Text>
      ))}

      <Hr style={{ borderColor: "#e5e7eb", margin: "20px 0" }} />

      <Row>
        <Column>
          <Text style={{ margin: 0, color: "#6b7280", fontSize: "13px" }}>Reason</Text>
          <Text style={{ margin: "2px 0 12px", color: "#111827", fontSize: "14px" }}>
            {RETURN_REASON_LABELS[returnRequest.reason]}
          </Text>
        </Column>
      </Row>
      <Row>
        <Column>
          <Text style={{ margin: 0, color: "#6b7280", fontSize: "13px" }}>Requested resolution</Text>
          <Text style={{ margin: "2px 0 12px", color: "#111827", fontSize: "14px" }}>
            {RETURN_RESOLUTION_LABELS[returnRequest.resolution]}
            {returnRequest.resolution === "refund" ? ` — ${money(returnRequest.refundAmount ?? 0)}` : ""}
          </Text>
        </Column>
      </Row>
      {returnRequest.description && (
        <Row>
          <Column>
            <Text style={{ margin: 0, color: "#6b7280", fontSize: "13px" }}>Notes</Text>
            <Text style={{ margin: "2px 0 0", color: "#111827", fontSize: "14px" }}>
              {returnRequest.description}
            </Text>
          </Column>
        </Row>
      )}
    </>
  );
}
