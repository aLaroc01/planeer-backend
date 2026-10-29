// Adjust the filename to match your existing helper.
import { SendEmail } from "./emailHelper";

export const sendSupportRequestAcknowledgment = async (
  recipientEmail: string,
) => {
  const subject = "We've received your inquiry — Planeer";

  const text = [
    "Hello,",
    "",
    "Thank you for contacting Planeer.",
    "",
    "We've received your inquiry. Our team will review it and contact " +
      "you at this email address as soon as possible.",
    "",
    "This is an automated acknowledgment confirming receipt of your " +
      "message. Your inquiry has not yet been resolved.",
    "",
    "For your privacy, please do not send passwords, verification " +
      "codes, or sensitive medical or financial documents by email.",
    "",
    "Thank you,",
    "The Planeer Team",
  ].join("\n");

  return SendEmail(
    recipientEmail,
    subject,
    text,
  );
};