import nodemailer, { Transporter } from "nodemailer";

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

let transporter: Transporter | null = null;

// Built on first use, so dotenv has already loaded by then
const getTransporter = (): Transporter => {
    if (transporter) return transporter;

    const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;
    if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
        throw new Error("Email is not configured: set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS and EMAIL_FROM");
    }

    const port = Number(EMAIL_PORT);
    transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port,
        secure: port === 465,
        auth: { user: EMAIL_USER, pass: EMAIL_PASS },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
    });
    return transporter;
};

export const sendEmail = async ({ to, subject, html }: EmailOptions): Promise<void> => {
    if (!process.env.EMAIL_FROM) {
        throw new Error("EMAIL_FROM is not set");
    }
    await getTransporter().sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
};


export const verifyEmailConnection = async (): Promise<void> => {
    await getTransporter().verify();
    console.log("Brevo SMTP connection successful");
};