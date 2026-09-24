import { nanoid } from "nanoid";
import { uploadObject } from "../../../lib/storage";
import * as settingsService from "../settings/service";

export async function getLogo() {
  const settings = await settingsService.getSettings();
  return { site_logo_url: settings.site_logo_url };
}

export async function uploadLogo(filename: string, contentType: string, buffer: Buffer) {
  const ext = filename.includes(".") ? filename.slice(filename.lastIndexOf(".")) : "";
  const url = await uploadObject(`logos/${nanoid()}${ext}`, buffer, contentType);
  await settingsService.updateSettings({ site_logo_url: url });
  return getLogo();
}

export async function removeLogo() {
  await settingsService.updateSettings({ site_logo_url: "" });
  return getLogo();
}
