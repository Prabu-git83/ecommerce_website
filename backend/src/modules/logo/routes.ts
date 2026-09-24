import type { FastifyInstance } from "fastify";
import * as logoService from "../admin/logo/service";
import { ok } from "../../lib/response";

export default async function logoRoutes(app: FastifyInstance) {
  app.get("/logo/active", async () => ok(await logoService.getLogo()));
}
