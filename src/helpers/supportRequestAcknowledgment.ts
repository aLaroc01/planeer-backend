// Use the actual path to your existing, working SendEmail helper.
import { SendEmail } from "./emailHelper";

export const sendSupportRequestAcknowledgment = async (
  recipientEmail: string,
) => {
  
  const logoUrl =
    "https://planeer-frontend.vercel.app/planeer-logo.png";

  const subject = "We've received your inquiry — Planeer";

  const html = `
    <img
      src="${logoUrl}"
      alt="Planeer"
      width="160"
      style="display:block; width:160px; max-width:100%; height:auto; border:0;"
    />
    <br /><br />

    Hello,
    <br /><br />

    Thank you for contacting Planeer.
    <br /><br />

    We've received your inquiry. Our team will review it and
    contact you at this email address as soon as possible.
    <br /><br />

    This is an automated acknowledgment confirming receipt
    of your message, not a resolution of your inquiry.
    <br /><br />

    Thank you,
    <br />
    The Planeer Team
  `;

  const text = [
    "Hello,",
    "",
    "Thank you for contacting Planeer.",
    "",
    "We've received your inquiry. Our team will review it and " +
      "contact you at this email address as soon as possible.",
    "",
    "This is an automated acknowledgment confirming receipt " +
      "of your message, not a resolution of your inquiry.",
    "",
    "Thank you,",
    "The Planeer Team",
  ].join("\n");

  try {
    const result = await SendEmail(
      recipientEmail,
      subject,
      text,
      html,
    );

    console.info(
      "[support acknowledgment] SendEmail resolved",
      result,
    );

    return result;
  } catch (error) {
    console.error(
      "[support acknowledgment] SendEmail failed",
      error,
    );

    // Let the controller's existing email catch handle the failure.
    throw error;
  }
};