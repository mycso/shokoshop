import { Text } from "@react-email/components";
import type { ReturnRequest } from "@/types";
import { EmailHeading, EmailLayout, ReturnSummary } from "./shared";

export function ReturnRequestReceivedEmail({ returnRequest }: { returnRequest: ReturnRequest }) {
  return (
    <EmailLayout
      preview={`We received your return request for order ${returnRequest.orderId}`}
      footerNote="You're receiving this because you requested a return with ShokoShop."
    >
      <EmailHeading>We&apos;ve got your request</EmailHeading>
      <Text style={{ color: "#4b5563", fontSize: "15px", lineHeight: "24px", margin: 0 }}>
        {`We've received your return request for order ${returnRequest.orderId} and will review it shortly. We'll email you again once it's been processed.`}
      </Text>

      <ReturnSummary returnRequest={returnRequest} />
    </EmailLayout>
  );
}

export default ReturnRequestReceivedEmail;
