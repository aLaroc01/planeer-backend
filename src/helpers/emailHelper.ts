import nodemailer from "nodemailer";
import mailgun from "nodemailer-mailgun-transport";
import { config } from "../app/config/index";

export const SendEmail = async (
  EmailTo: string,
  EmailSubject: string,
  EmailText: string,
  EmailHtml?: string
) => {
  const { api_key, domain, header_name, from } = config.email;

  if (!api_key || !domain) {
    throw new Error("Mailgun API key and domain are required");
  }

  if (!from) {
    throw new Error("MAILGUN_FROM is required");
  }

  const transporter = nodemailer.createTransport(
    mailgun({
      auth: {
        api_key,
        domain,
      },
    })
  );

  const mailOptions = {
    from: header_name ? `${header_name} <${from}>` : from,
    to: EmailTo,
    subject: EmailSubject,
    text: EmailText,
    html: EmailHtml ? `<p>${EmailHtml}</p>` : undefined,
  };

  return transporter.sendMail(mailOptions);
};
