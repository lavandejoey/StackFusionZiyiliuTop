// /StackFusionZiyiliuTop/frontend/src/hooks/useAuth.tsx
import {useContext} from "react";
import AuthCtx from "@/contexts/AuthContext";

export const useAuth = () => useContext(AuthCtx);