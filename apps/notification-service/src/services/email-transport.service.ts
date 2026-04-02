import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { AppConfig } from '../app.config';

interface MailOptions {
    to: string;
    from: string;
    subject: string;
    text: string;
    html: string;
}

@Injectable()
export class EmailTransportService {
    private transporter: nodemailer.Transporter;

    constructor(private readonly config: AppConfig) {
        const { host, port, user, pass } = config.email;
        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
        });
    }

    async sendMail(opts: MailOptions): Promise<void> {
        await this.transporter.sendMail(opts);
    }
}
