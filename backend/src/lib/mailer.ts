import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
});

export async function sendMail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    html,
  });
}

export const emailTemplates = {
  passwordReset(resetUrl: string) {
    return `<div style="font-family:sans-serif;max-width:480px">
      <h2>Reset your password</h2>
      <p>Click the link below to set a new password. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
    </div>`;
  },
  orderConfirmation(orderNumber: string, total: string, currency: string) {
    return `<div style="font-family:sans-serif;max-width:480px">
      <h2>Thanks for your order</h2>
      <p>Order <strong>${orderNumber}</strong> has been confirmed.</p>
      <p>Total charged: ${currency} ${total}</p>
    </div>`;
  },
  contactReceived(name: string) {
    return `<div style="font-family:sans-serif;max-width:480px">
      <h2>We received your message</h2>
      <p>Hi ${name}, thanks for reaching out — our team will reply within 1-2 business days.</p>
    </div>`;
  },
  loginOtp(code: string, ttlMinutes: number) {
    return `<div style="font-family:sans-serif;max-width:480px">
      <h2>Your sign-in code</h2>
      <p>Enter this code to sign in to Arca. It expires in ${ttlMinutes} minutes.</p>
      <p style="font-size:32px;font-weight:700;letter-spacing:0.3em;margin:16px 0">${code}</p>
      <p style="color:#6E6959;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
    </div>`;
  },
};
