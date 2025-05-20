// /StackFusionZiyiliuTop/frontend/src/components/ContactForm.tsx
import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import '@/styles/ContactForm.css';
import {faPaperPlane} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {Button} from "react-bootstrap";
import {apiMailingMessage} from "@/services/api.ts";

interface FormData {
    surname: string;
    firstName: string;
    email: string;
    message: string;
}

const ContactForm: React.FC = () => {
    const {t} = useTranslation();
    const [form, setForm] = useState<FormData>({
        surname: '',
        firstName: '',
        email: '',
        message: '',
    });
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setForm(f => ({...f, [name]: value}));
        setErrors(err => ({...err, [name]: ''}));
    };

    const validate = () => {
        const errs: typeof errors = {};
        if (!form.surname) errs.surname = t('This field is required');
        if (!form.firstName) errs.firstName = t('This field is required');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = t('Invalid email');
        if (!form.message) errs.message = t('This field is required');
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        const icon = document.getElementById('send-icon');
        icon?.classList.add('animate-fly-away');

        try {
            const res = await apiMailingMessage(form);
            if (res.status !== 200) {
                throw new Error('Failed to send message');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setTimeout(() => {
                icon?.remove();
                setSubmitting(false);
            }, 1000);
        }
    };

    return (
        <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <div className="row g-2 mb-3">
                <div className="col-12 col-md-6">
                    <label htmlFor="surname">{t('Surname')}</label>
                    <input
                        id="surname"
                        name="surname"
                        type="text"
                        className={`form-control ${errors.surname ? 'is-invalid' : ''}`}
                        placeholder={t('Surname')}
                        value={form.surname}
                        onChange={handleChange}
                        disabled={submitting}
                    />
                    <div className="invalid-feedback">{errors.surname}</div>
                </div>
                <div className="col-12 col-md-6">
                    <label htmlFor="first-name">{t('First Name')}</label>
                    <input
                        id="first-name"
                        name="firstName"
                        type="text"
                        className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                        placeholder={t('First Name')}
                        value={form.firstName}
                        onChange={handleChange}
                        disabled={submitting}
                    />
                    <div className="invalid-feedback">{errors.firstName}</div>
                </div>
            </div>

            <div className="mb-3">
                <label htmlFor="email">{t('Email')}</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    placeholder={t('Email')}
                    value={form.email}
                    onChange={handleChange}
                    disabled={submitting}
                />
                <div className="invalid-feedback">{errors.email}</div>
            </div>

            <div className="mb-3">
                <label htmlFor="message">{t('Message')}</label>
                <textarea
                    id="message"
                    name="message"
                    rows={5}
                    className={`form-control ${errors.message ? 'is-invalid' : ''}`}
                    placeholder={t('Message')}
                    value={form.message}
                    onChange={handleChange}
                    disabled={submitting}
                />
                <div className="invalid-feedback">{errors.message}</div>
            </div>

            <div className="d-grid mt-3">
                <Button type={"submit"} className={"btn-primary"} id={"send-button"} disabled={submitting}>
                    <span>{t('Send')}</span>
                    <FontAwesomeIcon icon={faPaperPlane} className="mx-2" id={'send-icon'}/>
                </Button>
            </div>
        </form>
    );
};

export default ContactForm;
