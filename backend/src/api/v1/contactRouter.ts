// /StackFusionZiyiliuTop/backend/src/routes/api/contact.ts
import xss from "xss";
import process from "node:process";
import rateLimit from "express-rate-limit";
import {Router, Request, Response} from "express";
import {body, validationResult} from "express-validator";
import {sendEmail} from "@/utils/postmark.util";
import {errorResponse, successResponse} from "@/middlewares/response";

const contactRouter = Router();
contactRouter.use(
    rateLimit({
        windowMs: Number(process.env.CONTACT_RATE_LIMIT_WINDOW_MS),
        limit: 5,
        standardHeaders: true,
        legacyHeaders: false,
    })
);

/** Email Contact Form
 *  Request: POST /api/v1/contact
 *  Body: {"surname": "...", "firstName": "...", "email": "...", "message": "..."}
 *  Response 200: {"success": true}
 */
contactRouter.post(
    "/",
    [
        body("surname").trim().notEmpty().withMessage("Surname is required"),
        body("firstName").trim().notEmpty().withMessage("First name is required"),
        body("email").trim().isEmail().withMessage("Valid email is required"),
        body("message")
            .trim()
            .isLength({min: 1, max: 1_000})
            .withMessage("Message is required and must be ≤ 1000 chars"),
    ],
    async (req: Request, res: Response): Promise<any> => {
        /* 1) validation result */
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json(errorResponse(req, 400, "Validation error", errors.array()));
        }

        /* 2) extract + sanitise */
        const {surname, firstName, email, message} = req.body;
        const safeMessage = xss(message); // simple HTML escaping

        /* 3) obligatory env check */
        if (!process.env.NO_REPLY_EMAIL || !process.env.CONTACT_EMAIL) {
            console.error(
                "contactRouter: NO_REPLY_EMAIL / CONTACT_EMAIL env vars missing"
            );
            return res.status(500).json(errorResponse(req, 500, "E-mail service not configured correctly."));
        }

        /* 4) send via Postmark util */
        try {
            await sendEmail({
                from: process.env.NO_REPLY_EMAIL,
                to: process.env.CONTACT_EMAIL,
                replyTo: email,
                subject: `[${process.env.DOMAIN}] New message from ${surname}, ${firstName}`,
                html: `<p><strong>${surname}, ${firstName}</strong> wrote:</p><p>${safeMessage}</p>`,
                message: safeMessage,
            });

            return res.status(200).json(successResponse(req, {}, "Message sent successfully."));
        } catch (err) {
            console.error("sendEmail error:", err);
            return res.status(500).json(errorResponse(req, 500, "Failed to send message."));
        }
    }
);

export default contactRouter;
