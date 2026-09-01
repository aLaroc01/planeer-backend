"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const nodemailer_mailgun_transport_1 = __importDefault(require("nodemailer-mailgun-transport"));
const config_1 = require("../app/config");
// export const SendEmail = async (EmailTo: string,  EmailText: string,  EmailSubject: string) => {
//   const transporter = nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     port: 587,
//     secure: false,
//     auth: {
//       user: "rkrafikridoy5887@gmail.com",
//       pass: "crba acbp ezyv rqlw",
//     },
//     tls: {
//       rejectUnauthorized: false,
//     },
//   });
//   const mailOptions = {
//         from:'Task manager MERN <rkrafikridoy5887@gmail.com>',
//         to:EmailTo,
//         subject:EmailText,
//         text:EmailSubject
//   };
//   return transporter.sendMail(mailOptions);
//   };
if (!config_1.config.email.api_key || !config_1.config.email.domain) {
    throw new Error("Mailgun configuration is missing in .env");
}
const SendEmail = async (EmailTo, EmailSubject, EmailText) => {
    const auth = {
        auth: {
            api_key: config_1.config.email.api_key,
            domain: config_1.config.email.domain,
        },
    };
    const transporter = nodemailer_1.default.createTransport((0, nodemailer_mailgun_transport_1.default)(auth));
    const mailOptions = {
        from: `${config_1.config.email.header_name} <${config_1.config.email.from}>`,
        to: EmailTo,
        subject: EmailSubject,
        text: EmailText,
    };
    return await transporter.sendMail(mailOptions);
};
exports.SendEmail = SendEmail;
