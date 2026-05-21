"use client";

import type { ReactNode } from "react";
import { ZeroProvider as RocicorpZeroProvider } from "@rocicorp/zero/react";
import { zeroOptions } from "../lib/zero/client";

type ZeroProviderProps = {
  children: ReactNode;
};

export function ZeroProvider({ children }: ZeroProviderProps) {
  return <RocicorpZeroProvider {...zeroOptions}>{children}</RocicorpZeroProvider>;
}
