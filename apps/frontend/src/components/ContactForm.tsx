// /StackFusionZiyiliuTop/frontend/src/components/ContactForm.tsx
import React, {useState} from "react";
import {useTranslation} from "react-i18next";
import "@/styles/ContactForm.css";
import {faPaperPlane} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {Alert, Button} from "react-bootstrap";
import {sendContactForm as apiMailingMessage} from "@/services/apiService";

interface FormData {
    surname: string,
    first_name: string,
    email: string,
    message: string,
}

export default function ContactForm() {
    const {t} = useTranslation();
    const [form, setForm] = useState<FormData>({
        surname: "",
        first_name: "",
        email: "",
        message: "",
    });
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
        {}
    );
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const {name, value} = e.target;
        setForm((f) => ({...f, [name]: value}));
        setErrors((err) => ({...err, [name]: ""}));
    };

    const validate = () => {
        const errs: typeof errors = {};
        if (!form.surname) errs.surname = t("This field is required");
        if (!form.first_name) errs.first_name = t("This field is required");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            errs.email = t("Invalid email");
        if (!form.message) errs.message = t("This field is required");
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting || submitSuccess) return;
        if (!validate()) return;

        setSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(false);

        try {
            const ok = await apiMailingMessage(form);
            if (ok) {
                setSubmitSuccess(true);
            } else {
                setSubmitError(t("Failed to send message. Please try again later."));
            }
        } catch (err) {
            console.error(err);
            setSubmitError(t("Failed to send message. Please try again later."));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className="contact-form" onSubmit={handleSubmit} noValidate>
            {submitError && <Alert variant="danger">{submitError}</Alert>}
            {submitSuccess && (
                <Alert variant="success">
                    {t("Your message has been sent successfully!")}
                </Alert>
            )}

            <div className="row g-2 mb-3">
                <div className="col-12 col-md-6">
                    <label htmlFor="surname">{t("Surname")}</label>
                    <input
                        id="surname"
                        name="surname"
                        type="text"
                        className={`form-control ${errors.surname ? "is-invalid" : ""}`}
                        placeholder={t("Surname")}
                        value={form.surname}
                        onChange={handleChange}
                        disabled={submitting || submitSuccess}
                    />
                    <div className="invalid-feedback">{errors.surname}</div>
                </div>
                <div className="col-12 col-md-6">
                    <label htmlFor="first_name">{t("First Name")}</label>
                    <input
                        id="first_name"
                        name="first_name"
                        type="text"
                        className={`form-control ${
                            errors.first_name ? "is-invalid" : ""
                        }`}
                        placeholder={t("First Name")}
                        value={form.first_name}
                        onChange={handleChange}
                        disabled={submitting || submitSuccess}
                    />
                    <div className="invalid-feedback">{errors.first_name}</div>
                </div>
            </div>

            <div className="mb-3">
                <label htmlFor="email">{t("Email")}</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    className={`form-control ${errors.email ? "is-invalid" : ""}`}
                    placeholder={t("Email")}
                    value={form.email}
                    onChange={handleChange}
                    disabled={submitting || submitSuccess}
                />
                <div className="invalid-feedback">{errors.email}</div>
            </div>

            <div className="mb-3">
                <label htmlFor="message">{t("Message")}</label>
                <textarea
                    id="message"
                    name="message"
                    rows={5}
                    className={`form-control ${errors.message ? "is-invalid" : ""}`}
                    placeholder={t("Message")}
                    value={form.message}
                    onChange={handleChange}
                    disabled={submitting || submitSuccess}
                />
                <div className="invalid-feedback">{errors.message}</div>
            </div>

            <div className="d-grid mt-3">
                <Button
                    type="submit"
                    className="btn-primary"
                    id="send-button"
                    disabled={submitting || submitSuccess}
                >
                    <span>{t("Send")}</span>
                    <FontAwesomeIcon
                        icon={faPaperPlane}
                        className="mx-2"
                        id="send-icon"
                    />
                </Button>
            </div>
        </form>
    );
}
