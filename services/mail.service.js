// services/mail.service.js → VERSION UNIVERSELLE (marche partout)
import nodemailer from "nodemailer";

const createTransporter = nodemailer.createTransporter || nodemailer.createTransport;

let transporter = null;

export const sendEmail = async (to, subject, html = "", text = "") => {
  if (!transporter) {
    if (!process.env.SMTP_HOST) return { skipped: true, reason: "SMTP not configured" };

    transporter = createTransporter({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS || process.env.MAIL_PASS
      } : undefined,
      tls: { rejectUnauthorized: false }
    });
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Promotion App" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, "")
    });
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    return { error: err.message };
  }
};