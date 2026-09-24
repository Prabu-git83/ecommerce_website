import type { FastifyInstance } from "fastify";
import * as logoService from "./service";
import { ok } from "../../../lib/response";
import { ApiError } from "../../../lib/errors";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);

export default async function adminLogoRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request) => {
    await app.requirePermission(request, ["logo"]);
  });

  app.get("/logo", async () => ok(await logoService.getLogo()));

  app.post("/logo/image", async (request) => {
    const file = await request.file();
    if (!file) throw ApiError.badRequest("No file uploaded", "no_files");
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      throw ApiError.badRequest(`Unsupported image type: ${file.mimetype}`, "unsupported_file_type");
    }
    const buffer = await file.toBuffer();
    return ok(await logoService.uploadLogo(file.filename, file.mimetype, buffer));
  });

  app.delete("/logo/image", async () => ok(await logoService.removeLogo()));
}
