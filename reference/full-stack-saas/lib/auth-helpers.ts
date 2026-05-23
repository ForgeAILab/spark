import { headers as nextHeaders } from 'next/headers';
import { auth } from '@/lib/auth';

export type Session = Awaited<ReturnType<typeof auth.api.getSession>>;
export type AuthenticatedSession = NonNullable<Session>;

type RequestWithHeaders = {
  headers: Headers;
};

type SessionRequestInput = Request | RequestWithHeaders | Headers;

async function resolveHeaders(requestOrHeaders?: SessionRequestInput): Promise<Headers> {
  if (!requestOrHeaders) {
    return (await nextHeaders()) as Headers;
  }

  if (requestOrHeaders instanceof Headers) {
    return requestOrHeaders;
  }

  return requestOrHeaders.headers;
}

export async function getSession(request?: SessionRequestInput): Promise<Session> {
  const activeHeaders = await resolveHeaders(request);

  return auth.api.getSession({
    headers: activeHeaders,
  }) as Promise<Session>;
}

export async function requireSession(
  request?: SessionRequestInput,
): Promise<AuthenticatedSession> {
  const session = await getSession(request);

  if (!session) {
    throw new Error('Authentication required');
  }

  return session as AuthenticatedSession;
}
