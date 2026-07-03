import { Text } from "@react-email/components";
import type { ReturnRequest } from "@/types";
import { EmailHeading, EmailLayout, ReturnSummary } from "./shared";

export function AdminReturnNotificationEmail({ returnRequest }: { returnRequest: ReturnRequest }) {
  return (
    <EmailLayout preview={`New return request for order ${returnRequest.orderId}`} footerNote="Internal notification — sent to the store admin inbox.">
      <EmailHeading>New return request</EmailHeading>
      <Text style={{ color: "#4b5563", fontSize: "15px", lineHeight: "24px", margin: 0 }}>
        {`${returnRequest.customerEmail} requested a return for order ${returnRequest.orderId}.`}
      </Text>

      <ReturnSummary returnRequest={returnRequest} />
    </EmailLayout>
  );
}

export default AdminReturnNotificationEmail;
