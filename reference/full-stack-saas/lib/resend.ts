import { Resend } from 'resend';

const DEFAULT_RESEND_API_KEY = 're_reference';

function env(name: string, fallback: string) {
  return process.env[name] ?? fallback;
}

export type ResendClientLike = {
  emails: {
    send(input: {
      from: string;
      to: string | string[];
      subject: string;
      html?: string;
      text?: string;
      replyTo?: string | string[];
    }): Promise<{
      data?: { id?: string | null } | null;
      error?: unknown;
    }>;
  };
};

export function createResendClient(apiKey = env('RESEND_API_KEY', DEFAULT_RESEND_API_KEY)) {
  return new Resend(apiKey) as unknown as ResendClientLike;
}

export const resend = createResendClient();

export type TransactionalEmailInput = {
  to: string | string[];
  subject: string;
  from?: string;
  replyTo?: string | string[];
  html?: string;
  text?: string;
};

export async function sendTransactional(
  input: TransactionalEmailInput,
  client: ResendClientLike = resend,
) {
  if (!input.html && !input.text) {
    throw new Error('sendTransactional requires html or text content');
  }

  return client.emails.send({
    from: input.from ?? env('RESEND_FROM_EMAIL', 'Reference App <onboarding@resend.dev>'),
    to: input.to,
    subject: input.subject,
    replyTo: input.replyTo,
    html: input.html,
    text: input.text,
  });
}
