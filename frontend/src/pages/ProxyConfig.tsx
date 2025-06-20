// /StackFusionZiyiliuTop/frontend/src/pages/ProxyConfig.tsx
import {useEffect} from "react";
import {useSearchParams} from "react-router-dom";
import {getProxyConfig} from "@/services/apiService";

export default function ProxyConfig() {
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email");

    useEffect(() => {
        if (!email) {
            console.error("Missing `email` query parameter");
            return;
        }

        getProxyConfig(email)
            .then((yaml) => {
                const blob = new Blob([yaml], {type: "text/yaml"});
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${email.split("@")[0]}.yaml`;
                a.click();
                URL.revokeObjectURL(url);
            })
            .catch((err) => {
                console.error("Failed to fetch proxy config:", err);
            });
    }, [email]);
    return null;
}
