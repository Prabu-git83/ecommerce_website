// One-off, idempotent: promotes the original seeded admin account
// (admin@arca.local) to the platform's one super admin. Safe to re-run —
// only touches that row, and only if it isn't already super_admin.
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, queryClient } from "./client";
import { adminUsers } from "./schema/index";

const SUPER_ADMIN_EMAIL = "admin@arca.local";

async function main() {
  const admin = await db.query.adminUsers.findFirst({ where: eq(adminUsers.email, SUPER_ADMIN_EMAIL) });
  if (!admin) {
    console.log(`No admin found with email ${SUPER_ADMIN_EMAIL} — run db:seed or seed-admin first.`);
    await queryClient.end();
    return;
  }
  if (admin.role === "super_admin") {
    console.log(`${SUPER_ADMIN_EMAIL} is already super_admin.`);
  } else {
    await db.update(adminUsers).set({ role: "super_admin", updatedAt: new Date() }).where(eq(adminUsers.id, admin.id));
    console.log(`Promoted ${SUPER_ADMIN_EMAIL} to super_admin.`);
  }
  console.log(`Super admin login: ${SUPER_ADMIN_EMAIL} (password = ADMIN_INITIAL_PASSWORD used at seed time; default admin123 - change it before going public)`);
  await queryClient.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
