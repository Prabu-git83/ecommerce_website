# Deploying Arca on free tiers (Vercel + Supabase)

Three Vercel projects from this repo (branch `Stagging_ecommerce`) plus one Supabase project.

| Vercel project | Root Directory | Framework |
|---|---|---|
| `arca-api`   | `backend` | Other (uses `backend/vercel.json`) |
| `arca-web`   | `website` | Next.js |
| `arca-admin` | `admin`   | Vite |

Set each project's **Production Branch** to `Stagging_ecommerce`.
Supabase project ref: `pdadkyeywvuetshuyvse`.

## 1. Supabase (dashboard)
1. **Storage** -> New bucket `product-images`, **Public** on.
2. **Storage -> S3 Connection**: create an access key; note the key id, secret and region.
3. **Connect** button: copy the *Transaction pooler* string (port 6543) -> `DATABASE_URL` for Vercel,
   and the *Session pooler* string (port 5432) -> for the one-off setup below.

## 2. Load the database (once, from your PC)
```powershell
cd backend
$env:DATABASE_URL = "<session pooler string>?sslmode=require"
$env:ADMIN_INITIAL_PASSWORD = "<choose a strong password>"
npm run db:setup     # migrate + seed catalogue + super admin + brands
```
Never commit these values.

## 3. Vercel: `arca-api` (deploy this first)
| Variable | Value |
|---|---|
| NODE_ENV | production |
| DATABASE_URL | transaction pooler string + `?sslmode=require` |
| DATABASE_POOLED | true |
| DATABASE_POOL_MAX | 1 |
| JWT_ACCESS_SECRET / JWT_REFRESH_SECRET / COOKIE_SECRET | new random strings (32+ chars) |
| S3_ENDPOINT | https://pdadkyeywvuetshuyvse.supabase.co/storage/v1/s3 |
| S3_REGION / S3_ACCESS_KEY / S3_SECRET_KEY | from step 1.2 |
| S3_BUCKET | product-images |
| S3_PUBLIC_URL | https://pdadkyeywvuetshuyvse.supabase.co/storage/v1/object/public/product-images |
| MAX_UPLOAD_MB | 4 |
| WEB_APP_URL / ADMIN_APP_URL | the web / admin Vercel URLs (add after they exist, then redeploy) |
| SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS | e.g. Brevo `smtp-relay.brevo.com` / `587` (needed for OTP + order emails) |
| SMTP_FROM | a sender verified with your mail provider |

Check `https://<api>.vercel.app/health` returns `{"status":"ok"}`.

## 4. Vercel: `arca-web`
| Variable | Value |
|---|---|
| NEXT_PUBLIC_API_URL | /v1 |
| API_URL | https://<api>.vercel.app/v1 |
| API_ORIGIN | https://<api>.vercel.app |

## 5. Vercel: `arca-admin`
| Variable | Value |
|---|---|
| VITE_API_URL | https://<api>.vercel.app/v1 |

## 6. Finish
Set `WEB_APP_URL` and `ADMIN_APP_URL` on `arca-api`, redeploy it, then sign in to the admin
as `admin@arca.local` with the password from step 2.

## Free-tier caveats
- Supabase pauses projects after ~1 week of inactivity.
- Vercel Hobby is non-commercial use only.
- API request bodies are capped at ~4.5 MB (hence `MAX_UPLOAD_MB=4`).
- Payments are still the mock provider.
