import type { PropsWithChildren } from 'react';
import { Switch } from 'wouter';

export function Router({ children }: PropsWithChildren) {
  return <Switch>{children}</Switch>;
}
