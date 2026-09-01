
import nodemailer from "nodemailer";
import mailgun from "nodemailer-mailgun-transport";
import { config } from "../app/config";

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



if (!config.email.api_key || !config.email.domain) {
  throw new Error("Mailgun configuration is missing in .env");
}


export const SendEmail = async (
  EmailTo: string,
  EmailSubject: string,
  EmailText: string
) => {
  const auth = {
    auth: {
      api_key: config.email.api_key  as string,
      domain: config.email.domain  as string,
    },
  };

  const transporter = nodemailer.createTransport(mailgun(auth));


  const mailOptions = {
    from: `${config.email.header_name} <${config.email.from}>`,
    to: EmailTo,
    subject: EmailSubject,
    text: EmailText,
  };

  return await transporter.sendMail(mailOptions);
};