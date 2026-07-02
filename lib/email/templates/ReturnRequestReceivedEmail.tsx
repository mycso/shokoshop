import { Body, Container, Head, Heading, Html, Img, Preview, Text } from "@react-email/components";
import type { ReturnRequest } from "@/types";
import { ReturnSummary, logoUrl } from "./shared";

export function ReturnRequestReceivedEmail({ returnRequest }: { returnRequest: ReturnRequest }) {
  return (
    <Html>
      <Head />
      <Preview>We received your return request for order {returnRequest.orderId}</Preview>
      <Body style={{ backgroundColor: "#f9fafb", fontFamily: "sans-serif" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "16px", maxWidth: "480px" }}>
          <Img src={logoUrl()} width="36" height="36" alt="ShokoShop" />
          <Heading style={{ fontSize: "22px", color: "#111827" }}>We&apos;ve got your request</Heading>
          <Text style={{ color: "#4b5563", fontSize: "15px", lineHeight: "24px" }}>
            We&apos;ve received your return request for order {returnRequest.orderId} and will review it shortly.
            We&apos;ll email you again once it&apos;s been processed.
          </Text>

          <ReturnSummary returnRequest={returnRequest} />
        </Container>
      </Body>
    </Html>
  );
}

export default ReturnRequestReceivedEmail;
