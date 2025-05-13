// /StackFusionZiyiliuTop/backend/src/routes/api/contact.ts
import {Router} from 'express';
import {body, validationResult} from 'express-validator';
import {sendEmail} from 'utils/postmark.util';
import process from "node:process";   // adjust this alias/path to your setup

const contactRouter = Router()
const JWT_SECRET: string = process.env.JWT_SECRET_KEY || "secret";
const REFRESH_TOKEN_EXPIRY: number = Number(process.env.REFRESH_TOKEN_EXPIRY) || 3600;
const ACCESS_TOKEN_EXPIRY: number = Number(process.env.ACCESS_TOKEN_EXPIRY) || 3600;

/** Email Contact Form
 * POST /api/v1/contact
 * Body:
 *   { surname, firstName, email, message }
 * @example
 * Request:
 * POST /api/v1/contact
 * Body: { "surname": "Ziyi", "firstName": "Liu", "email": "xxx@xx.com", "message": "Hello!" }
 * Response:
 * { "success": true }
 */
contactRouter.post(
    '/',
    [
        body('surname').notEmpty().withMessage('Surname is required'),
        body('firstName').notEmpty().withMessage('First name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('message').notEmpty().withMessage('Message is required'),
    ],
    async (req: any, res: any): Promise<any> => {
        // 1) check validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {surname, firstName, email, message} = req.body;

        // 2) send via Postmark util
        try {
            await sendEmail({
                from: process.env.NO_REPLY_EMAIL,
                to: process.env.CONTACT_EMAIL,
                replyTo: email,
                subject: `[ZiyiLiu.top] New message from ${surname}, ${firstName}`,
                html: `<p><strong>${surname}, ${firstName}</strong> wrote:</p><p>${message}</p>`,
                message,
            });
            return res.json({success: true});
        } catch (err) {
            console.error('sendEmail error:', err);
            return res.status(500).json({error: 'Failed to send email'});
        }
    }
);

export default contactRouter;
