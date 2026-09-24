import type { FastifyInstance } from "fastify";
import { z } from "zod";
import * as bannerService from "./service";
import { ok } from "../../../lib/response";
import { ApiError } from "../../../lib/errors";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

export default async function adminBannerRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request) => {
    await app.requirePermission(request, ["banner"]);
  });

  app.get("/banner", async () => {
    const banner = await bannerService.getBanner();
    return ok(banner);
  });

  app.put("/banner", async (request) => {
    const body = z
      .object({
        banner_eyebrow: z.string().max(100).optional(),
        banner_heading: z.string().max(200).optional(),
        banner_subtext: z.string().max(400).optional(),
        banner_cta_label: z.string().max(60).optional(),
        banner_cta_link: z.string().max(300).optional(),
      })
      .parse(request.body);
    const banner = await bannerService.updateBanner(body);
    return ok(banner);
  });

  app.post("/banner/image", async (request) => {
    const file = await request.file();
    if (!file) throw ApiError.badRequest("No file uploaded", "no_files");
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      throw ApiError.badRequest(`Unsupported image type: ${file.mimetype}`, "unsupported_file_type");
    }
    const buffer = await file.toBuffer();
    const banner = await bannerService.uploadBannerImage(file.filename, file.mimetype, buffer);
    return ok(banner);
  });

  app.delete("/banner/image", async () => {
    const banner = await bannerService.removeBannerImage();
    return ok(banner);
  });
}
