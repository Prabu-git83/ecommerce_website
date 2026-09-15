import { buildApp } from "./app";
import { env } from "./config/env";
import { ensureBucket } from "./lib/storage";

async function main() {
  const app = await buildApp();

  try {
    await ensureBucket();
  } catch (err) {
    app.log.warn({ err }, "Could not verify MinIO bucket — is MinIO running? (npm run infra:up)");
  }

  await app.listen({ port: env.PORT, host: env.HOST });
  app.log.info(`API ready at http://localhost:${env.PORT}/v1`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
