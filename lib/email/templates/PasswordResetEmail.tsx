import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { BRAND } from "./shared";

export function PasswordResetEmail({ resetUrl }: { resetUrl: string }) {
  return (
    <Html>
      <Head />
      <Preview>Reset your ShokoShop password</Preview>
      <Body style={{ backgroundColor: "#f9fafb", fontFamily: "sans-serif" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "16px", maxWidth: "480px" }}>
          <Heading style={{ fontSize: "22px", color: "#111827" }}>Reset your password</Heading>
          <Text style={{ color: "#4b5563", fontSize: "15px", lineHeight: "24px" }}>
            We received a request to reset your ShokoShop password. This link expires in 1 hour. If you
            didn&apos;t request this, you can safely ignore this email.
          </Text>
          <Section style={{ marginTop: "24px" }}>
            <Link
              href={resetUrl}
              style={{
                backgroundColor: BRAND,
                color: "#ffffff",
                padding: "12px 20px",
                borderRadius: "12px",
                fontWeight: 600,
                fontSize: "14px",
                textDecoration: "none",
              }}
            >
              Reset password
            </Link>
          </Section>
          <Text style={{ color: "#9ca3af", fontSize: "12px", marginTop: "24px", wordBreak: "break-all" }}>
            {resetUrl}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default PasswordResetEmail;
