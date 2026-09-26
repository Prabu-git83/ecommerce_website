import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default("0.0.0.0"),

  DATABASE_URL: z.string().url(),
  // true when DATABASE_URL points at a transaction-mode pooler (e.g. Supabase :6543), which disallows prepared statements
  DATABASE_POOLED: z.enum(["true","false"]).default("false"),
  DATABASE_POOL_MAX: z.coerce.number().default(10),
  MAX_UPLOAD_MB: z.coerce.number().default(8),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().default(30),

  S3_ENDPOINT: z.string().default("http://localhost:9000"),
  S3_REGION: z.string().default("us-east-1"),
  S3_ACCESS_KEY: z.string().default("ecommerce"),
  S3_SECRET_KEY: z.string().default("ecommerce_dev_password"),
  S3_BUCKET: z.string().default("product-images"),
  S3_PUBLIC_URL: z.string().default("http://localhost:9000/product-images"),

  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z.enum(["true","false"]).default("false"),
  SMTP_FROM: z.string().default("Arca <no-reply@arca.local>"),

  WEB_APP_URL: z.string().default("http://localhost:3000"),
  ADMIN_APP_URL: z.string().default("http://localhost:5173"),

  COOKIE_SECRET: z.string().min(8).default("dev_cookie_secret_change_me"),
  CART_COOKIE_NAME: z.string().default("arca_cart"),
});

// Hosting dashboards often store blank values; treat those as unset so schema defaults apply.
const raw = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== undefined && v.trim() !== ""));

export const env = envSchema.parse(raw);
