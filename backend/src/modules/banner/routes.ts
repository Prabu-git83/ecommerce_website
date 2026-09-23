import type { FastifyInstance } from "fastify";
import * as bannerService from "../admin/banner/service";
import { ok } from "../../lib/response";

export default async function bannerRoutes(app: FastifyInstance) {
  app.get("/banner/active", async () => {
    const banner = await bannerService.getBanner();
    return ok(banner);
  });
}
