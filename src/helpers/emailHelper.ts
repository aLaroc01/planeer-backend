import FormData from "form-data";
import Mailgun from "mailgun.js";
import { config } from "../app/config/index";

const mailgun = new Mailgun(FormData);

export const SendEmail = async (
  EmailTo: string,
  EmailSubject: string,
  EmailText: string,
  EmailHtml?: string
) => {
  const { api_key, domain, header_name, from } = config.email;

  const apiKey = api_key?.trim();
  const sendingDomain = domain?.trim();
  const senderEmail = from?.trim();
  const senderName = header_name?.trim();

  const apiUrl =
    process.env.MAILGUN_API_URL?.trim() ||
    "https://api.mailgun.net";

  if (!apiKey || !sendingDomain) {
    throw new Error("Mailgun API key and domain are required");
  }

  if (!senderEmail) {
    throw new Error("MAILGUN_FROM is required");
  }

  const mg = mailgun.client({
    username: "api",
    key: apiKey,
    url: apiUrl,
  });

  const sender = senderName
    ? `${senderName} <${senderEmail}>`
    : senderEmail;

  try {
    const result = await mg.messages.create(sendingDomain, {
      from: sender,
      to: [EmailTo],
      subject: EmailSubject,
      text: EmailText,
      ...(EmailHtml ? { html: EmailHtml } : {}),
    });

    console.info("[Mailgun] Message accepted", {
      id: result.id,
      message: result.message,
    });

    return result;
  } catch (error) {
    const mailgunError = error as {
      message?: string;
      status?: number;
      statusCode?: number;
    };

    console.error("[Mailgun] Send failed", {
      message: mailgunError.message,
      status: mailgunError.status ?? mailgunError.statusCode,
      domain: sendingDomain,
      apiUrl,
    });

    throw error;
  }
};