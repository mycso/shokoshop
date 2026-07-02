import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import type { ReturnRequest } from "@/types";
import { ReturnSummary } from "./shared";

export function AdminReturnNotificationEmail({ returnRequest }: { returnRequest: ReturnRequest }) {
  return (
    <Html>
      <Head />
      <Preview>New return request for order {returnRequest.orderId}</Preview>
      <Body style={{ backgroundColor: "#f9fafb", fontFamily: "sans-serif" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "16px", maxWidth: "480px" }}>
          <Heading style={{ fontSize: "22px", color: "#111827" }}>New return request</Heading>
          <Text style={{ color: "#4b5563", fontSize: "15px", lineHeight: "24px" }}>
            {returnRequest.customerEmail} requested a return for order {returnRequest.orderId}.
          </Text>

          <ReturnSummary returnRequest={returnRequest} />
        </Container>
      </Body>
    </Html>
  );
}

export default AdminReturnNotificationEmail;
