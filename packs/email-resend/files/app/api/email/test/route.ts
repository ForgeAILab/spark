import WelcomeEmail from "@/emails/welcome";
import { sendEmail } from "@/lib/email";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

type TestEmailRequest = {
  to?: string;
  name?: string;
  productName?: string;
};

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (request.headers.get("x-spark-dev-email") !== "true") {
    return NextResponse.json({ error: "Dev email flag is required" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as TestEmailRequest;

  if (!body.to) {
    return NextResponse.json({ error: "to is required" }, { status: 400 });
  }

  const result = await sendEmail({
    to: body.to,
    subject: `Welcome to ${body.productName ?? "the app"}`,
    react: WelcomeEmail({
      name: body.name,
      productName: body.productName,
    }),
  });

  return NextResponse.json({ id: result.data?.id });
}
