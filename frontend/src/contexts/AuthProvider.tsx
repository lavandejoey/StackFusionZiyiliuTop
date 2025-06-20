// src/contexts/AuthProvider.tsx
import {type ReactNode, useState, useEffect} from "react";
import {AuthContext} from "./useAuth";
import {
    login as loginService,
    signup as signupService,
    logout as logoutService,
    getMe,
} from "@/services/authService";
import type {UserModel} from "@/types/User.ts";

export function AuthProvider({children}: { children: ReactNode }) {
    const [user, setUser] = useState<UserModel | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const me = await getMe();
                setUser(me);
            } catch {
                sessionStorage.removeItem(import.meta.env.VITE_ACCESS_TOKEN_KEY);
                setUser(null);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const login = async (email: string, password: string) => {
        const {user} = await loginService(email, password);
        setUser(user);
        return user;
    };

    const signup = async (payload: Parameters<typeof signupService>[0]) => {
        const {user} = await signupService(payload);
        setUser(user);
        return user;
    };

    const logout = async () => {
        await logoutService();
        sessionStorage.removeItem(import.meta.env.VITE_ACCESS_TOKEN_KEY);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{user, loading, login, signup, logout}}>
            {children}
        </AuthContext.Provider>
    );
}
