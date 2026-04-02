export interface EmailJobData {
    to: string;
    from: string;
    subject: string;
    text: string;
    html: string;
    metadata?: {
        type?: string;
        userId?: string;
        priority?: number;
    };
}

export const EMAIL_QUEUE_NAME = 'email';
