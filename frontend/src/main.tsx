// /StackFusionZiyiliuTop/frontend/src/main.tsx
import React from "react";
import {createRoot} from "react-dom/client";
import App from "@/App";
import "@/i18n.ts";
import "@/styles/main.scss";
import "@/assets/fonts/HarmonyOS.css";
import "@/assets/fonts/shantell.css";
import {HelmetProvider} from 'react-helmet-async';

createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <HelmetProvider>
            <App/>
        </HelmetProvider>
    </React.StrictMode>
);
