"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendEmail = void 0;
const form_data_1 = __importDefault(require("form-data"));
const mailgun_js_1 = __importDefault(require("mailgun.js"));
const index_1 = require("../app/config/index");
const mailgun = new mailgun_js_1.default(form_data_1.default);
const SendEmail = async (EmailTo, EmailSubject, EmailText, EmailHtml) => {
    const { api_key, domain, header_name, from } = index_1.config.email;
    const apiKey = api_key?.trim();
    const sendingDomain = domain?.trim();
    const senderEmail = from?.trim();
    const senderName = header_name?.trim();
    const apiUrl = process.env.MAILGUN_API_URL?.trim() ||
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
    }
    catch (error) {
        const mailgunError = error;
        console.error("[Mailgun] Send failed", {
            message: mailgunError.message,
            status: mailgunError.status ?? mailgunError.statusCode,
            domain: sendingDomain,
            apiUrl,
        });
        throw error;
    }
};
exports.SendEmail = SendEmail;
