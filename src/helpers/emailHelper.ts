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

  console.info("[Mailgun runtime configuration]", {
      domain,
      from,
      hasApiKey: Boolean(api_key),
      apiKeyLength:
        typeof api_key === "string" ? api_key.length : 0,
      keyHasOuterWhitespace:
        typeof api_key === "string" &&
        api_key !== api_key.trim(),
      matchesMailgunEnvironmentKey:
        api_key === process.env.MAILGUN_API_KEY,
      matchesMailgunEnvironmentDomain:
        domain === process.env.MAILGUN_DOMAIN,
    });
    
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
