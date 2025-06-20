// /StackFusionZiyiliuTop/frontend/src/pages/ProxyConfig.tsx
import {Navigate, useLocation} from "react-router-dom";

function ProxyConfig() {
    const {search} = useLocation();
    const backend = import.meta.env.PROD
        ? import.meta.env.VITE_API_DOMAIN_PROD
        : import.meta.env.VITE_API_DOMAIN_DEV;
    const yamlUrl = `${backend}/api/${import.meta.env.VITE_API_VERSION}/proxy/config${search}`;
    return <Navigate to={`${yamlUrl}`} replace state={{from: window.location.pathname}}/>;
}

export default ProxyConfig;