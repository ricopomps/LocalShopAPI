import nodemailer from "nodemailer";
import env from "../util/validateEnv";

export interface IEmailService {
  sendEmail(
    to: string,
    subject: string,
    content: string,
    htmlContent: string
  ): Promise<EmailResponse>;
}

interface EmailResponse {
  accepted: string[];
  rejected: string[];
  messageId: string;
}

export class EmailService implements IEmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: parseInt(env.EMAIL_SMTP_PORT),
      secure: false,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
      tls: {
        ciphers: "SSLv3",
      },
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    content: string,
    htmlContent: string
  ): Promise<EmailResponse> {
    const mailOptions = {
      from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
      to,
      subject,
      text: content,
      html: htmlContent,
    };

    const info = await this.transporter.sendMail(mailOptions);

    return info;
  }
}
