// /StackFusionZiyiliuTop/backend/src/common/util/postmark.ts
import {POSTMARK_API_TOKEN, NO_REPLY_EMAIL, CONTACT_EMAIL} from "@src/common/constants/ENV";
import {ServerClient} from "postmark";
import {ContactMail} from "@src/types/mail";

const apiToken = POSTMARK_API_TOKEN;
if (!apiToken) throw new Error("Missing POSTMARK_API_TOKEN");
export const postmarkClient = new ServerClient(apiToken);

export async function sendEmail(opts: ContactMail): Promise<void> {
    const payload = {
        From: opts.from ?? NO_REPLY_EMAIL,
        To: opts.to ?? CONTACT_EMAIL,
        ReplyTo: opts.replyTo,
        Subject: opts.subject ?? "New message from your site",
        HtmlBody: opts.html,
        TextBody: opts.text,
        MessageStream: "outbound",
    };

    await postmarkClient.sendEmail(payload);
}