import nodemailer, { Transporter } from "nodemailer";

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

// 'QuickDine <me@example.com>' -> { name, email }
const parseFrom = (from: string) => {
    const match = from.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
    return match
        ? { name: match[1].trim() || undefined, email: match[2].trim() }
        : { email: from.trim() };
};

const sendViaBrevoApi = async ({ to, subject, html }: EmailOptions): Promise<void> => {
    const from = process.env.EMAIL_FROM;
    if (!from) throw new Error("EMAIL_FROM is not set");

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "api-key": process.env.BREVO_API_KEY as string,
            "content-type": "application/json",
            accept: "application/json",
        },
        body: JSON.stringify({
            sender: parseFrom(from),
            to: [{ email: to }],
            subject,
            htmlContent: html,
        }),
        signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Brevo API ${res.status}: ${body.slice(0, 300)}`);
    }
};

let transporter: Transporter | null = null;

const getTransporter = (): Transporter => {
    if (transporter) return transporter;

    const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;
    if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
        throw new Error("Email is not configured: set BREVO_API_KEY, or EMAIL_HOST, EMAIL_PORT, EMAIL_USER and EMAIL_PASS");
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
        dnsTimeout: 15_000,
    });
    return transporter;
};

// Called once at startup (see server.ts)
export const verifyEmailConnection = async (): Promise<void> => {
    if (process.env.BREVO_API_KEY) {
        console.log("Email: using Brevo HTTP API");
        return;
    }
    try {
        await getTransporter().verify();
        console.log("Email: SMTP connection OK");
    } catch (error) {
        console.error("Email SMTP check failed:", error instanceof Error ? error.message : error);
    }
};

export const sendEmail = async (options: EmailOptions): Promise<void> => {
    if (process.env.BREVO_API_KEY) {
        return sendViaBrevoApi(options);
    }

    if (!process.env.EMAIL_FROM) throw new Error("EMAIL_FROM is not set");
    await getTransporter().sendMail({ from: process.env.EMAIL_FROM, ...options });
};