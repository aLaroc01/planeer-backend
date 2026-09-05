import formData from "form-data";
import Mailgun from "mailgun.js";

type SendProxyInviteEmailArgs = {
  to: string;
  inviteUrl: string;
};

const mailgun = new Mailgun(formData);

const mailgunApiKey = process.env.MAILGUN_API_KEY;
const mailgunDomain = process.env.MAILGUN_DOMAIN;


if (!mailgunApiKey) {
  throw new Error("MAILGUN_API_KEY is not defined");
}

if (!mailgunDomain) {
  throw new Error("MAILGUN_DOMAIN is not defined");
}


const mg = mailgun.client({
  username: "api",
  key: mailgunApiKey,
});

export const sendProxyInviteEmail = async ({
  to,
  inviteUrl,
}: SendProxyInviteEmailArgs) => {
  return mg.messages.create(mailgunDomain, {
    from: `Planeer <mail@${mailgunDomain}>`,
    to,
    subject: "You're invited to join as a proxy",
    html: `
      <p>You were invited to join as a proxy.</p>
      <p><a href="${inviteUrl}">Accept invitation</a></p>
    `,
  });
};