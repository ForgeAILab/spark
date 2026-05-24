import { app } from "@/server/router";

export const runtime = "nodejs";

export const GET = app.fetch;
export const POST = app.fetch;
