import nodemailer from "nodemailer";

const sendEmail = async ({
  from = process.env.EMAIL,
  to,
  subject,
  html,
  attachments,
}) => {
  const transporter = nodemailer.createTransport({
    host: "localhost",
    port: 465,
    secure: true,
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const info = await transporter.sendMail({
    from: `"E-Learning" <${from}>`, // sender address
    to,
    subject,
    html,
    attachments,
  });
  return info.accepted.length > 0 ? true : false;
};

export default sendEmail;
