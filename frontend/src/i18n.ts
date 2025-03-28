// /StackFusionZiyiliuTop/frontend/src/i18n.ts
import i18n from "i18next";
import {initReactI18next} from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import your translation JSON files
import en from "@/locales/en.json"
import fr from "@/locales/fr.json"
import zhCN from "@/locales/zh-CN.json"
import zhHK from "@/locales/zh-HK.json"

i18n.use(LanguageDetector).use(initReactI18next).init({
    // Fallback language when detection fails or a translation is missing
    fallbackLng: "en",
    // Debugging logs in development
    debug: process.env.NODE_ENV === "development",
    // Translation resources
    resources: {
        en: {translation: en},
        fr: {translation: fr},
        "zh-CN": {translation: zhCN},
        "zh-HK": {translation: zhHK},
    },
    interpolation: {
        escapeValue: false, // React already does XSS protection
    },
    detection: {
        order: ['querystring', 'cookie', 'localStorage', 'navigator'],
        lookupQuerystring: 'lang',
        caches: ['cookie'],
    },
});

export default i18n;
