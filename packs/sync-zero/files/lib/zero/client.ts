"use client";

import type { ZeroOptions } from "@rocicorp/zero";
import { schema } from "./schema";

export const zeroOptions = {
  cacheURL: "http://localhost:4848",
  schema,
} satisfies ZeroOptions;
