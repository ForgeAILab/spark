/**
 * Placeholder session lookup.
 *
 * Returns `null` until an auth pack (e.g. `auth-better-auth`) replaces this
 * module with a real `getSessionUser` that reads cookies / headers and
 * resolves the active user.
 *
 * The shape returned here is the contract auth packs must honor: they should
 * export the same `getSessionUser` signature so consumers in `app/(app)/**`
 * keep working without further edits.
 */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  // TODO: replaced by `auth-better-auth` (or another auth pack).
  return null;
}
