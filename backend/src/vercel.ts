// Vercel serverless entry. Bundled to dist/vercel.cjs by `npm run build:vercel`;
// api/index.js just re-exports it. One Fastify instance is reused per warm lambda.
import type { IncomingMessage, ServerResponse } from "node:http";
import { buildApp } from "./app";

let ready: ReturnType<typeof buildApp> | undefined;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  ready ??= buildApp().then(async (app) => {
    await app.ready();
    return app;
  });
  const app = await ready;
  app.server.emit("request", req, res);
}
