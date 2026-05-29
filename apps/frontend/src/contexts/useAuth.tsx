// /StackFusionZiyiliuTop/frontend/src/contexts/useAuth.tsx
import {createContext, useContext} from "react";
import type {UserModel} from "@/types/User";
import type {SignupPayload} from "@/services/authService";

export interface AuthContextType {
    user: UserModel | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<UserModel>;
    signup: (payload: SignupPayload) => Promise<UserModel>;
    logout: () => Promise<void>;
}

// Only export the context object here
export const AuthContext = createContext<AuthContextType | undefined>(
    undefined
);

/**
 * Custom hook for accessing auth state/actions.
 * Throws if used outside AuthProvider.
 */
export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be inside an <AuthProvider>");
    }
    return ctx;
}
