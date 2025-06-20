// /StackFusionZiyiliuTop/frontend/src/pages/ProxyConfig.tsx
import {useEffect} from "react";
import {useSearchParams} from "react-router-dom";

export default function ProxyConfig() {
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email") ?? "";
    const backend = import.meta.env.PROD
        ? import.meta.env.VITE_API_DOMAIN_PROD
        : import.meta.env.VITE_API_DOMAIN_DEV;  // includes port in dev

    const yamlUrl = `${backend}/api/${import.meta.env.VITE_API_VERSION}/proxy/config?email=${encodeURIComponent(email)}`;

    useEffect(() => {
        window.location.replace(yamlUrl);
    }, []);
    return null;
}