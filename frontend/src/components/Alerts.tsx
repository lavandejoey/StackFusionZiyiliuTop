// /StackFusionZiyiliuTop/frontend/src/components/Alerts.tsx
import React from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faInfoCircle,
    faExclamationTriangle,
    faCheckCircle,
    faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";

interface AlertMessageProps {
    type: "info" | "danger" | "success" | "warning";
    message?: string;
}

const AlertMessage: React.FC<AlertMessageProps> = ({type, message}) => {
    if (!message) return null;

    let icon;
    switch (type) {
        case "info":
            icon = faInfoCircle;
            break;
        case "danger":
            icon = faExclamationTriangle;
            break;
        case "success":
            icon = faCheckCircle;
            break;
        case "warning":
            icon = faExclamationCircle;
            break;
    }

    return (
        <div className="container my-0">
            <div
                className={`alert alert-dismissible fade show alert-${type}`}
                role="alert"
            >
                {icon ? <FontAwesomeIcon icon={icon} className="me-2" aria-hidden="true"/> : null}
                <span>{message}</span>
                <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="alert"
                    aria-label="Close"
                />
            </div>
        </div>
    );
};

interface AlertsProps {
    info?: string;
    error?: string;
    success?: string;
    warning?: string;
}

const Alerts: React.FC<AlertsProps> = ({info, error, success, warning}) => {
    return (
        <>
            {info && <AlertMessage type="info" message={info}/>}
            {error && <AlertMessage type="danger" message={error}/>}
            {success && <AlertMessage type="success" message={success}/>}
            {warning && <AlertMessage type="warning" message={warning}/>}
        </>
    );
};

export default Alerts;
