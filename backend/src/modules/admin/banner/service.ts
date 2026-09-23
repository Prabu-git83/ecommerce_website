import { nanoid } from "nanoid";
import { uploadObject } from "../../../lib/storage";
import * as settingsService from "../settings/service";

const BANNER_KEYS = [
  "banner_eyebrow",
  "banner_heading",
  "banner_subtext",
  "banner_cta_label",
  "banner_cta_link",
  "banner_image_url",
] as const;

export type BannerKey = (typeof BANNER_KEYS)[number];

function pick(settings: Record<settingsService.SettingKey, string>) {
  const result = {} as Record<BannerKey, string>;
  for (const key of BANNER_KEYS) result[key] = settings[key];
  return result;
}

export async function getBanner() {
  return pick(await settingsService.getSettings());
}

export async function updateBanner(values: Partial<Record<BannerKey, string>>) {
  return pick(await settingsService.updateSettings(values));
}

export async function uploadBannerImage(filename: string, contentType: string, buffer: Buffer) {
  const ext = filename.includes(".") ? filename.slice(filename.lastIndexOf(".")) : "";
  const key = `banners/${nanoid()}${ext}`;
  const url = await uploadObject(key, buffer, contentType);
  return updateBanner({ banner_image_url: url });
}

export async function removeBannerImage() {
  return updateBanner({ banner_image_url: "" });
}
