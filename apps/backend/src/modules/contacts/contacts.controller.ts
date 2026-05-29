// /StackFusionZiyiliuTop/backend/src/routes/contactRoutes.ts
import xss from "xss";
import rateLimit from "express-rate-limit";
import { Request, Response, Router } from "express";
import { body, validationResult } from "express-validator";
import { sendEmail } from "@src/common/util/postmark";
import { errorResponse, successResponse } from "@src/common/util/response";
import { CONTACT_EMAIL, CONTACT_RATE_LIMIT_WINDOW_MS, DOMAIN, NO_REPLY_EMAIL } from "@src/common/constants/ENV";
import httpStatusCodes from "@src/common/constants/HttpStatusCodes";
import logger from "jet-logger";
import { ENDPOINTS } from "@src/common/constants/ENDPOINTS";

export const contactRouter = Router();
contactRouter.use(
    rateLimit({
        windowMs: CONTACT_RATE_LIMIT_WINDOW_MS,
        limit: 5,
        standardHeaders: true,
        legacyHeaders: false,
    }),
);

/** Email Contact Form
 *  Request: POST /api/v1/contact
 *  Body: {"surname": "...", "first_name": "...", "email": "...", "message": "..."}
 *  Response 200: {"success": true}
 */
contactRouter.post(
    ENDPOINTS.contacts.submit,
    [
        body("surname").trim().notEmpty().withMessage("Surname is required"),
        body("first_name").trim().notEmpty().withMessage("First name is required"),
        body("email").trim().isEmail().withMessage("Valid email is required"),
        body("message")
            .trim()
            .isLength({ min: 1, max: 1_000 })
            .withMessage("Message is required and must be ≤ 1000 chars"),
    ],
    async (req: Request, res: Response) => {
        /* 1) validation result */
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res
                .status(httpStatusCodes.BAD_REQUEST)
                .send(errorResponse(req, res, "Validation error", errors.array()));
        }

        /* 2) extract + sanitise */
        const { surname, first_name, email, message } = req.body as {
            surname: string, first_name: string, email: string, message: string,
        };
        const safeMessage = xss(message); // simple HTML escaping

        /* 3) obligatory env check */
        if (!NO_REPLY_EMAIL || !CONTACT_EMAIL) {
            logger.err("contactRouter: NO_REPLY_EMAIL / CONTACT_EMAIL env vars missing");
            res
                .status(httpStatusCodes.INTERNAL_SERVER_ERROR)
                .send(errorResponse(req, res, "E-mail service not configured correctly."));
        }

        /* 4) send via Postmark util */
        try {
            await sendEmail({
                from: NO_REPLY_EMAIL,
                to: CONTACT_EMAIL,
                replyTo: email,
                subject: `[${DOMAIN}] New message from ${surname}, ${first_name}`,
                html: `<p>${surname}, ${first_name} wrote:</p><br/><p>${safeMessage}</p>`,
                text: safeMessage,
            });

            res
                .status(httpStatusCodes.OK)
                .send(successResponse(req, res, { success: true }, "Message sent successfully!"));
        } catch (err) {
            logger.err(`sendEmail error: ${err}`);
            res
                .status(httpStatusCodes.INTERNAL_SERVER_ERROR)
                .send(errorResponse(req, res, "Failed to send message."));
        }
    },
);