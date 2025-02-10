const nodemailer = require("nodemailer");
require("dotenv").config();

const mailsender = async (email, title, body) => {
  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.appName,
        pass: process.env.appPass,
      },
    });

    let info = await transporter.sendMail({
      from: "bertleyprisy@gmail.com  Blix",
      to: email,
      subject: title,
      text: body,
    });

    console.log("Email info:", info);

    return info;
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = mailsender;
