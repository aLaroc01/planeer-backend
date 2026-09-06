"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendProxyInviteEmail = void 0;
const form_data_1 = __importDefault(require("form-data"));
const mailgun_js_1 = __importDefault(require("mailgun.js"));
const mailgun = new mailgun_js_1.default(form_data_1.default);
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
const sendProxyInviteEmail = async ({ to, inviteUrl, }) => {
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
exports.sendProxyInviteEmail = sendProxyInviteEmail;
