import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../../db/client";
import { contactMessages } from "../../db/schema/index";
import { ok } from "../../lib/response";
import { sendMail, emailTemplates } from "../../lib/mailer";

const contactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  subject: z.string().max(300).optional(),
  message: z.string().min(1).max(4000),
});

export default async function contactRoutes(app: FastifyInstance) {
  app.post("/contact", async (request, reply) => {
    const body = contactSchema.parse(request.body);
    const [created] = await db.insert(contactMessages).values({ ...body, userId: request.userId }).returning();
    sendMail(body.email, "We received your message", emailTemplates.contactReceived(body.name)).catch(() => {});
    reply.status(201);
    return ok({ id: created.id, success: true });
  });
}
