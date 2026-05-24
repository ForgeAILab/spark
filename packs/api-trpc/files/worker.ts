import { app } from "./server/router";

export default {
  fetch(request: Request, _env: unknown, _ctx: unknown): Promise<Response> | Response {
    return app.fetch(request);
  },
};
