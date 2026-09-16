import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default("0.0.0.0"),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().default("redis://localhost:6379"),

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
  SMTP_FROM: z.string().default("Arca <no-reply@arca.local>"),

  WEB_APP_URL: z.string().default("http://localhost:3000"),
  ADMIN_APP_URL: z.string().default("http://localhost:5173"),

  COOKIE_SECRET: z.string().min(8).default("dev_cookie_secret_change_me"),
  CART_COOKIE_NAME: z.string().default("arca_cart"),
});

export const env = envSchema.parse(process.env);
