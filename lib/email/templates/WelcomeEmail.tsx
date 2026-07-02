import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { BRAND, baseUrl, logoUrl } from "./shared";

export function WelcomeEmail({ name }: { name: string }) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to ShokoShop, {name}!</Preview>
      <Body style={{ backgroundColor: "#f9fafb", fontFamily: "sans-serif" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "16px", maxWidth: "480px" }}>
          <Img src={logoUrl()} width="36" height="36" alt="ShokoShop" />
          <Heading style={{ fontSize: "22px", color: "#111827" }}>Welcome, {name}!</Heading>
          <Text style={{ color: "#4b5563", fontSize: "15px", lineHeight: "24px" }}>
            Thanks for creating a ShokoShop account. You&apos;re all set to shop exclusive designs and track
            your orders from one place.
          </Text>
          <Section style={{ marginTop: "24px" }}>
            <Link
              href={`${baseUrl()}/account`}
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
              Go to my account
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;
