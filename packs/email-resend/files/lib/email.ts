import type { ReactElement } from "react";
import { Resend } from "resend";

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const resend = new Resend(requireEnv("RESEND_API_KEY"));

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  from?: string;
  replyTo?: string | string[];
  react?: ReactElement;
  html?: string;
  text?: string;
};

export async function sendEmail(input: SendEmailInput) {
  if (!input.react && !input.html && !input.text) {
    throw new Error("sendEmail requires react, html, or text content");
  }

  return resend.emails.send({
    from: input.from ?? process.env.RESEND_FROM ?? "App <onboarding@resend.dev>",
    to: input.to,
    subject: input.subject,
    replyTo: input.replyTo,
    react: input.react,
    html: input.html,
    text: input.text,
  });
}
