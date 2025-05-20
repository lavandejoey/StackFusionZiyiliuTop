// /StackFusionZiyiliuTop/frontend/src/hooks/useAuth.tsx
import React, {createContext, useContext, useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {apiFetchSelfUser, apiLogin, apiLogout} from "@/services/api";

export interface AuthUser {
    uuid: string;
    email: string;
    first_name: string;
    last_name: string;
    roles: string[];
    created_at: string;
    updated_at: string;
}

// Context
type Ctx = {
    user: AuthUser | null;
    ready: boolean;
    login: (e: string, p: string) => Promise<void>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>({} as Ctx);

export function AuthProvider({children}: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [ready, setReady] = useState(false);       // ← NEW
    const navigate = useNavigate();

    // fetch once on mount
    const refresh = async () => {
        try {
            const {data} = await apiFetchSelfUser();
            setUser(data.data as AuthUser);
        } catch {
            setUser(null);
        } finally {
            setReady(true);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const login = async (email: string, password: string) => {
        const {data} = await apiLogin(email, password);
        setUser(data.data.user);
        setReady(true);
        navigate(`/user/${data.data.user.uuid}`, {replace: true});
    };

    const logout = async () => {
        await apiLogout();
        setUser(null);
        setReady(true);
        navigate("/auth", {replace: true});
    };

    return (
        <AuthCtx.Provider value={{user, ready, login, logout, refresh}}>
            {children}
        </AuthCtx.Provider>
    );
}

// handy hook
export const useAuth = () => useContext(AuthCtx);
