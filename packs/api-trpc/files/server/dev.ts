import { app } from "./router";

const port = Number(process.env.PORT ?? 8787);
console.log(`Dev API listening at http://localhost:${port}`);
export default {
  port,
  fetch: app.fetch,
};
