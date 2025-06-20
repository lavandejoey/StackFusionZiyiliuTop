// /StackFusionZiyiliuTop/frontend/src/components/AuthForm.tsx
import "@/styles/AuthForm.css";
import {useRef, useState, useEffect, type FormEvent, useMemo,} from "react";
import {useNavigate} from "react-router-dom";
import {SwitchTransition, CSSTransition} from "react-transition-group";
import {
    Alert, Button, Col, FloatingLabel, Form,
    Row, Spinner, Tab, Tabs,
} from "react-bootstrap";
import debounce from "lodash.debounce";
import {useAuth} from "@/contexts/useAuth";
import {apiEmailExists} from "@/services/authService";
import {isAxiosError} from "axios";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Explicit form‐field types for stronger TS guarantees
interface FormFields {
    email: string;
    password: string;
    confirmPassword: string;
    first_name: string;
    last_name: string;
}

type FieldName = keyof FormFields;

export function AuthForm() {
    /* ---------------- state ---------------- */
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [form, setForm] = useState<FormFields>({
        email: "",
        password: "",
        confirmPassword: "",
        first_name: "",
        last_name: "",
    });
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
    const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
    const [checkingEmail, setCheckingEmail] = useState(false);
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [submitAttempted, setSubmitAttempted] = useState(false);

    // pull both login & signup from context
    const {login, signup} = useAuth();
    const navigate = useNavigate();
    const formRef = useRef<HTMLFormElement>(null);

    /* ---- async e-mail “exists” check (debounced) ---- */
    const checkEmail = useMemo(
        () =>
            debounce(async (value: string) => {
                if (!emailRegex.test(value)) return;
                setCheckingEmail(true);
                try {
                    const exists = await apiEmailExists(value);
                    setFieldErrors((prev) => ({
                        ...prev,
                        email:
                            mode === "signup"
                                ? exists
                                    ? "E-mail already in use"
                                    : ""
                                : !exists
                                    ? "E-mail not found"
                                    : "",
                    }));
                } catch {
                    setFieldErrors((prev) => ({
                        ...prev,
                        email: "Unable to verify e-mail right now",
                    }));
                } finally {
                    setCheckingEmail(false);
                }
            }, 400),
        [mode]
    );

    useEffect(() => checkEmail.cancel, [checkEmail]);

    /* ---- local validation on every change ---- */
    useEffect(() => {
        const errors: Partial<Record<FieldName, string>> = {};
        if (form.email && !emailRegex.test(form.email)) {
            errors.email = "Enter a valid e-mail";
        }
        if (form.password && (form.password.length < 6 || form.password.length > 32)) {
            errors.password = "Must be 6–32 characters";
        }
        if (mode === "signup") {
            if (!form.first_name.trim()) errors.first_name = "First name required";
            if (!form.last_name.trim()) errors.last_name = "Last name required";
            if (
                form.confirmPassword &&
                form.password !== form.confirmPassword
            ) {
                errors.confirmPassword = "Passwords do not match";
            }
        }
        // Replace errors wholesale so resolved errors are cleared
        setFieldErrors(errors);
    }, [form, mode]);

    /* ---- enable/disable submit button ---- */
    const allRequiredFilled =
        mode === "login"
            ? Boolean(form.email && form.password)
            : (Object.values(form) as string[]).every(Boolean);
    const noVisibleErrors = (Object.entries(fieldErrors) as [FieldName, string][])
        .filter(([key]) => touched[key] || submitAttempted)
        .every(([, msg]) => !msg);
    const canSubmit = !loading && !checkingEmail && allRequiredFilled && noVisibleErrors;

    /* ---- submit handler for login or signup ---- */
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitAttempted(true);
        if (!canSubmit) return;

        setLoading(true);
        setServerError(null);

        try {
            let user;
            if (mode === "login") {
                user = await login(form.email, form.password);
            } else {
                user = await signup({
                    first_name: form.first_name,
                    last_name: form.last_name,
                    email: form.email,
                    password: form.password,
                });
            }

            navigate(`/users/${user.uuid}`, {replace: true});
        } catch (error) {
            console.error("Login/signup failed", error);
            if (isAxiosError(error) && error.response) {
                setServerError(error.response.data.message || "An unexpected error occurred.");
            } else {
                setServerError("Unable to log in / sign up. Please check your credentials and try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    /* ---- generic helpers ---- */
    const markTouched = (field: FieldName) =>
        setTouched((t) => ({...t, [field]: true}));
    const localInvalid = (field: FieldName) =>
        (touched[field] || submitAttempted) && Boolean(fieldErrors[field]);

    /* ---- render ---- */
    return (
        <Row className="justify-content-center">
            <Col>
                <h2 className="text-center mb-5">
                    {mode === "login" ? "👋 Welcome back!" : "Let's get started…"}
                </h2>

                <Tabs
                    id="auth-tabs"
                    activeKey={mode}
                    onSelect={(k) => {
                        if (k === "login" || k === "signup") {
                            setMode(k);
                            setForm({
                                email: "",
                                password: "",
                                confirmPassword: "",
                                first_name: "",
                                last_name: "",
                            });
                            setFieldErrors({});
                            setTouched({});
                            setSubmitAttempted(false);
                            setServerError(null);
                        }
                    }}
                    className="mb-4 justify-content-center"
                >
                    <Tab eventKey="login" title="Log in"/>
                    <Tab eventKey="signup" title="Sign up"/>
                </Tabs>

                {serverError && (
                    <Alert
                        variant="danger"
                        dismissible
                        onClose={() => setServerError(null)}
                    >
                        {serverError}
                    </Alert>
                )}

                <SwitchTransition>
                    <CSSTransition
                        key={mode}
                        classNames="fade-slide"
                        timeout={180}
                        nodeRef={formRef}
                        unmountOnExit
                    >
                        <Form ref={formRef} noValidate onSubmit={handleSubmit}>
                            {/* ---------- when in “Sign up” mode, show first/last name ---------- */}
                            {mode === "signup" && (
                                <Row xs={1} md={2} className="g-2">
                                    {(["first_name", "last_name"] as FieldName[]).map(
                                        (f, i) => (
                                            <Col key={f}>
                                                <FloatingLabel
                                                    controlId={f}
                                                    label={i === 0 ? "First name" : "Last name"}
                                                    className="mb-2"
                                                >
                                                    <Form.Control
                                                        type="text"
                                                        placeholder={i === 0 ? "John" : "Doe"}
                                                        value={form[f]}
                                                        autoComplete={
                                                            i === 0 ? "given-name" : "family-name"
                                                        }
                                                        onChange={(e) =>
                                                            setForm((prev) => ({
                                                                ...prev,
                                                                [f]: e.target.value,
                                                            }))
                                                        }
                                                        onBlur={() => markTouched(f)}
                                                        isInvalid={localInvalid(f)}
                                                        required
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {fieldErrors[f]}
                                                    </Form.Control.Feedback>
                                                </FloatingLabel>
                                            </Col>
                                        )
                                    )}
                                </Row>
                            )}

                            {/* ---------- email ---------- */}
                            <FloatingLabel
                                controlId="email"
                                label="Email address"
                                className="mb-2"
                            >
                                <Form.Control
                                    type="email"
                                    placeholder="name@example.com"
                                    value={form.email}
                                    autoComplete="email"
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setForm((f) => ({...f, email: v}));
                                        // clear stale error immediately
                                        setFieldErrors((prev) => ({...prev, email: ""}));
                                        checkEmail(v);
                                    }}
                                    onBlur={() => markTouched("email")}
                                    isInvalid={localInvalid("email")}
                                    required
                                />
                                <Form.Control.Feedback type="invalid">
                                    {checkingEmail ? "Checking…" : fieldErrors.email}
                                </Form.Control.Feedback>
                            </FloatingLabel>

                            {/* ---------- password ---------- */}
                            <FloatingLabel
                                controlId="password"
                                label="Password"
                                className="mb-3"
                            >
                                <Form.Control
                                    type="password"
                                    placeholder="Password"
                                    value={form.password}
                                    autoComplete={
                                        mode === "login"
                                            ? "current-password"
                                            : "new-password"
                                    }
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            password: e.target.value,
                                        }))
                                    }
                                    onBlur={() => markTouched("password")}
                                    isInvalid={localInvalid("password")}
                                    required
                                    minLength={6}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {fieldErrors.password}
                                </Form.Control.Feedback>
                            </FloatingLabel>

                            {/* ---------- confirm password ---------- */}
                            {mode === "signup" && (
                                <FloatingLabel
                                    controlId="confirmPassword"
                                    label="Confirm password"
                                    className="mb-3"
                                >
                                    <Form.Control
                                        type="password"
                                        placeholder="Confirm password"
                                        value={form.confirmPassword}
                                        autoComplete="new-password"
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                confirmPassword: e.target.value,
                                            }))
                                        }
                                        onBlur={() => markTouched("confirmPassword")}
                                        isInvalid={localInvalid("confirmPassword")}
                                        required
                                        minLength={6}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {fieldErrors.confirmPassword}
                                    </Form.Control.Feedback>
                                </FloatingLabel>
                            )}

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-100 d-flex align-items-center justify-content-center"
                                disabled={!canSubmit}
                            >
                                {(loading || checkingEmail) && (
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                        className="me-2"
                                    />
                                )}
                                {mode === "login" ? "Log in" : "Sign up"}
                            </Button>
                        </Form>
                    </CSSTransition>
                </SwitchTransition>
            </Col>
        </Row>
    );
}
