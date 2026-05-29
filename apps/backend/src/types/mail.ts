// /StackFusionZiyiliuTop/backend/src/types/mail.ts
export interface ContactMail {
    from?: string;
    to?: string;
    replyTo?: string;
    subject?: string;
    html?: string;
    text?: string;
}