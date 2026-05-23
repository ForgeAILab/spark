/**
 * Post entity shape.
 *
 * Kept stable so packs that wire real data (e.g. `sync-zero`) can reuse the
 * same type without diverging field names.
 */
export interface Post {
  id: string;
  userId: string;
  title: string;
  body: string;
  createdAt: Date;
}
