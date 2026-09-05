"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const nodemailer_mailgun_transport_1 = __importDefault(require("nodemailer-mailgun-transport"));
const index_1 = require("../app/config/index");
const SendEmail = async (EmailTo, EmailSubject, EmailText, EmailHtml) => {
    const { api_key, domain, header_name, from } = index_1.config.email;
    if (!api_key || !domain) {
        throw new Error("Mailgun API key and domain are required");
    }
    if (!from) {
        throw new Error("MAILGUN_FROM is required");
    }
    const transporter = nodemailer_1.default.createTransport((0, nodemailer_mailgun_transport_1.default)({
        auth: {
            api_key,
            domain,
        },
    }));
    const mailOptions = {
        from: header_name ? `${header_name} <${from}>` : from,
        to: EmailTo,
        subject: EmailSubject,
        text: EmailText,
        html: EmailHtml ? `<p>${EmailHtml}</p>` : undefined,
    };
    return transporter.sendMail(mailOptions);
};
exports.SendEmail = SendEmail;
