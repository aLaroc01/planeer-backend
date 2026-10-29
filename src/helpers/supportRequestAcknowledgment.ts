// Use the actual path to your existing, working SendEmail helper.
import { SendEmail } from "./emailHelper";

export const sendSupportRequestAcknowledgment = async (
  recipientEmail: string,
) => {
  console.info("[support acknowledgment] Helper reached");

  const subject = "We've received your inquiry — Planeer";

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