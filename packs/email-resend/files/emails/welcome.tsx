import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type WelcomeEmailProps = {
  name?: string;
  productName?: string;
};

export default function WelcomeEmail({
  name = "there",
  productName = "the app",
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {productName}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section>
            <Heading style={heading}>Welcome, {name}</Heading>
            <Text style={paragraph}>
              Your account is ready. You can now continue setting up {productName}.
            </Text>
            <Text style={paragraph}>
              Keep this email as a simple delivery check while the product email
              system is being wired up.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#f6f7f9",
  color: "#111827",
  fontFamily: "Arial, sans-serif",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "32px",
  maxWidth: "560px",
};

const heading = {
  fontSize: "24px",
  lineHeight: "32px",
  margin: "0 0 16px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};
