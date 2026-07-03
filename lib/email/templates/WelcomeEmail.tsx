import { Text } from "@react-email/components";
import { EmailButton, EmailHeading, EmailLayout, baseUrl } from "./shared";

export function WelcomeEmail({ name }: { name: string }) {
  return (
    <EmailLayout preview={`Welcome to ShokoShop, ${name}!`} footerNote="You're receiving this because you created a ShokoShop account.">
      <EmailHeading>{`Welcome, ${name}!`}</EmailHeading>
      <Text style={{ color: "#4b5563", fontSize: "15px", lineHeight: "24px", margin: 0 }}>
        Thanks for creating a ShokoShop account. You&apos;re all set to shop exclusive designs and track
        your orders from one place.
      </Text>
      <EmailButton href={`${baseUrl()}/account`}>Go to my account</EmailButton>
    </EmailLayout>
  );
}

export default WelcomeEmail;
