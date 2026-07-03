import {
  Body,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
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
export const ACCENT = "#e70a9b";
export const TEXT = "#111827";
export const MUTED = "#6b7280";
export const BORDER = "#e5e7eb";

export function logoUrl(): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  // PNG, not the site's SVG — Outlook desktop doesn't render inline SVG images.
  return `${base}/shokoshoplogo-email.png`;
}

export function baseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
}

export function money(pence: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

/**
 * Shared chrome for every outbound email — branded header, card body, footer.
 * Individual templates only need to supply the preview text and body content.
 */
export function EmailLayout({
  preview,
  footerNote,
  children,
}: {
  preview: string;
  footerNote?: string;
  children: ReactNode;
}) {
  const year = new Date().getFullYear();
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#f4f5f7", fontFamily: "Helvetica, Arial, sans-serif", margin: 0, padding: "32px 16px" }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto" }}>
          {/* Header */}
          <Section style={{ textAlign: "center", padding: "8px 0 20px" }}>
            <Img
              src={logoUrl()}
              width="40"
              height="40"
              alt="ShokoShop"
              style={{ margin: "0 auto 10px", display: "block" }}
            />
            <Text
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: 800,
                letterSpacing: "1.5px",
                color: TEXT,
              }}
            >
              SHOKOSHOP
            </Text>
          </Section>

          {/* Card */}
          <Section
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              border: `1px solid ${BORDER}`,
              padding: "36px 32px",
            }}
          >
            {children}
          </Section>

          {/* Footer */}
          <Section style={{ textAlign: "center", padding: "24px 12px 0" }}>
            <Text style={{ margin: "0 0 8px", color: MUTED, fontSize: "13px" }}>
              <Link href={`${baseUrl()}/products`} style={{ color: MUTED, textDecoration: "underline" }}>Shop</Link>
              {"  ·  "}
              <Link href={`${baseUrl()}/account/orders`} style={{ color: MUTED, textDecoration: "underline" }}>My Orders</Link>
              {"  ·  "}
              <Link href={`${baseUrl()}/account/returns`} style={{ color: MUTED, textDecoration: "underline" }}>My Returns</Link>
            </Text>
            {footerNote && (
              <Text style={{ margin: "0 0 4px", color: "#9ca3af", fontSize: "12px" }}>{footerNote}</Text>
            )}
            <Text style={{ margin: 0, color: "#9ca3af", fontSize: "12px" }}>
              © {year} ShokoShop. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailHeading({ children }: { children: ReactNode }) {
  return (
    <Text style={{ margin: "0 0 12px", fontSize: "22px", fontWeight: 700, color: TEXT }}>
      {children}
    </Text>
  );
}

export function EmailButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Section style={{ marginTop: "24px" }}>
      <Link
        href={href}
        style={{
          backgroundColor: BRAND,
          color: "#ffffff",
          padding: "13px 24px",
          borderRadius: "999px",
          fontWeight: 600,
          fontSize: "14px",
          textDecoration: "none",
          display: "inline-block",
        }}
      >
        {children}
      </Link>
    </Section>
  );
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
