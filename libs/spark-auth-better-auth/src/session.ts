import { headers as nextHeaders } from 'next/headers';
import type { AuthInstance } from './createAuth';

type AuthWithSession = {
  api: {
    getSession(options: { headers: Headers }): unknown;
  };
};

type RequestWithHeaders = {
  headers: Headers;
};

export type SessionRequestInput = Request | RequestWithHeaders | Headers;
export type SessionFor<TAuth extends AuthWithSession> = Awaited<
  ReturnType<TAuth['api']['getSession']>
>;
export type AuthenticatedSessionFor<TAuth extends AuthWithSession> = NonNullable<
  SessionFor<TAuth>
>;
export type SessionUserFor<TAuth extends AuthWithSession> =
  AuthenticatedSessionFor<TAuth> extends { user: infer User } ? User : never;

export type Session = SessionFor<AuthInstance>;
export type AuthenticatedSession = AuthenticatedSessionFor<AuthInstance>;
export type SessionUser = SessionUserFor<AuthInstance>;

async function resolveHeaders(requestOrHeaders?: SessionRequestInput): Promise<Headers> {
  if (!requestOrHeaders) {
    return (await nextHeaders()) as Headers;
  }

  if (requestOrHeaders instanceof Headers) {
    return requestOrHeaders;
  }

  return requestOrHeaders.headers;
}

export async function getSession<TAuth extends AuthWithSession>(
  auth: TAuth,
  requestOrHeaders?: SessionRequestInput,
): Promise<SessionFor<TAuth> | null> {
  const activeHeaders = await resolveHeaders(requestOrHeaders);

  return auth.api.getSession({
    headers: activeHeaders,
  }) as Promise<SessionFor<TAuth> | null>;
}

export async function requireSession<TAuth extends AuthWithSession>(
  auth: TAuth,
  requestOrHeaders?: SessionRequestInput,
): Promise<AuthenticatedSessionFor<TAuth>> {
  const session = await getSession(auth, requestOrHeaders);

  if (!session) {
    throw new Error('Authentication required');
  }

  return session as AuthenticatedSessionFor<TAuth>;
}
