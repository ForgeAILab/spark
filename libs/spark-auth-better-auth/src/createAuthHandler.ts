import { toNextJsHandler } from 'better-auth/next-js';

export type AuthHandlerAuth = Parameters<typeof toNextJsHandler>[0];
export type AuthHandler = ReturnType<typeof toNextJsHandler>;

export function createAuthHandler(authInstance: AuthHandlerAuth): AuthHandler {
  return toNextJsHandler(authInstance);
}
