import { Text } from "@react-email/components";
import { EmailButton, EmailHeading, EmailLayout } from "./shared";

export function PasswordResetEmail({ resetUrl }: { resetUrl: string }) {
  return (
    <EmailLayout preview="Reset your ShokoShop password" footerNote="You're receiving this because a password reset was requested for your account.">
      <EmailHeading>Reset your password</EmailHeading>
      <Text style={{ color: "#4b5563", fontSize: "15px", lineHeight: "24px", margin: 0 }}>
        We received a request to reset your ShokoShop password. This link expires in 1 hour. If you
        didn&apos;t request this, you can safely ignore this email.
      </Text>
      <EmailButton href={resetUrl}>Reset password</EmailButton>
      <Text style={{ color: "#9ca3af", fontSize: "12px", marginTop: "24px", wordBreak: "break-all" }}>
        {resetUrl}
      </Text>
    </EmailLayout>
  );
}

export default PasswordResetEmail;
