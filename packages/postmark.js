// Require:
const postmark = require("postmark");

async function sendEmail(emailOptions) {
    const client = new postmark.ServerClient(process.env.POSTMARK_API_TOKEN);

    await client.sendEmail({
        "From": emailOptions.from || process.env.NO_REPLY_EMAIL,
        "To": emailOptions.to || process.env.NO_REPLY_EMAIL,
        "Subject": emailOptions.subject || "From ZiyiLiu.top",
        "HtmlBody": emailOptions.html,
        "TextBody": emailOptions.message,
        "MessageStream": "outbound"
    });
}