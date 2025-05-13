// /StackFusionZiyiliuTop/backend/src/utils/postmark.util.ts
import * as postmark from "postmark";

async function sendEmail(emailOptions: any = {}): Promise<void> {
    const client = new postmark.ServerClient(process.env.POSTMARK_API_TOKEN || "");

    await client.sendEmail({
        "From": emailOptions.from || process.env.NO_REPLY_EMAIL,
        "To": emailOptions.to || process.env.CONTACT_EMAIL,
        "ReplyTo": emailOptions.replyTo || "",
        "Subject": emailOptions.subject || "From ZiyiLiu.top",
        "HtmlBody": emailOptions.html,
        "TextBody": emailOptions.message,
        "MessageStream": "outbound"
    });
}

export {sendEmail};