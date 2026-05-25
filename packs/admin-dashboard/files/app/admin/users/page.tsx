'use client';

// Users table — list, search by email, filter by role, and toggle role.
// Placeholder rows are seeded so the page renders standalone out of the box;
// replace them with a real DB query (wire me: see comments below).

import { useState, useTransition } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { toggleUserRole } from './actions';

// ---------------------------------------------------------------------------
// Placeholder data
// ---------------------------------------------------------------------------
// wire me: replace with a real DB query, e.g.:
//   const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
type UserRow = { id: string; email: string; name: string | null; role: string };

const PLACEHOLDER_USERS: UserRow[] = [
  { id: 'usr_1', email: 'alice@example.com', name: 'Alice', role: 'admin' },
  { id: 'usr_2', email: 'bob@example.com', name: 'Bob', role: 'user' },
  { id: 'usr_3', email: 'carol@example.com', name: null, role: 'user' },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [isPending, startTransition] = useTransition();

  // wire me: replace PLACEHOLDER_USERS with data from your server component / SWR / server action
  const rows = PLACEHOLDER_USERS.filter((u) => {
    const matchesSearch = u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  function handleToggleRole(user: UserRow) {
    startTransition(async () => {
      await toggleUserRole(user.id, user.role);
    });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Users</h1>

      {/* Toolbar: search + role filter */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-64"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 capitalize">
              Role: {roleFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {(['all', 'admin', 'user'] as const).map((r) => (
              <DropdownMenuItem
                key={r}
                className={cn('capitalize', roleFilter === r && 'font-semibold')}
                onSelect={() => setRoleFilter(r)}
              >
                {r}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Users table — full width, trailing-edge row actions */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                  {search || roleFilter !== 'all'
                    ? 'No users match the current filters.'
                    : 'No users yet. Wire this table to your DB (ADM-001).'}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-sm">{user.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.name ?? <span className="italic">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  {/* Trailing-edge actions */}
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleToggleRole(user)}
                      title={
                        user.role === 'admin' ? 'Demote to user' : 'Promote to admin'
                      }
                    >
                      {user.role === 'admin' ? 'Demote' : 'Promote'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* wire me: add pagination / load-more when the table is backed by real data */}
    </div>
  );
}
