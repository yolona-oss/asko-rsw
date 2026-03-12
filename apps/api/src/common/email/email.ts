import nodemailer from "nodemailer";

// (((>_<)))
const EMAIL = {
    port: process.env.EMAIL_SMTP_PORT!,
    host: process.env.EMAIL_HOST!,
    authUser: process.env.EMAIL_AUTH_USER!,
    authPass: process.env.EMAIL_AUTH_PASS!,
};

export type MailOptions = {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
}

export class EmailService {
    private static instance: EmailService;
    private transporter: nodemailer.Transporter;

    private constructor() {
        this.transporter = nodemailer.createTransport({
            service: `gmail`,
            auth: {
                user: EMAIL.authUser,
                pass: EMAIL.authPass,
            },
        });
        console.log("Email service initialized", EMAIL)
    }

    public static getInstance(): EmailService {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }

    async sendMail(opts: MailOptions) {
        return await this.transporter.sendMail({
            from: opts.from,
            to: opts.to,
            subject: opts.subject,
            text: opts.text,
            html: opts.html,
        });
    }
}
