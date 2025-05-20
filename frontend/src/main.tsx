// /StackFusionZiyiliuTop/frontend/src/main.tsx
import React from "react";
import {createRoot} from "react-dom/client";
import {BrowserRouter} from "react-router-dom";
import {HelmetProvider} from "react-helmet-async";
import App from "@/App";
import "@/i18n";
import "@/styles/main.scss";
import "@/assets/fonts/HarmonyOS.css";
import "@/assets/fonts/shantell.css";

createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BrowserRouter>
            <HelmetProvider>
                <App/>
            </HelmetProvider>
        </BrowserRouter>
    </React.StrictMode>,
);
