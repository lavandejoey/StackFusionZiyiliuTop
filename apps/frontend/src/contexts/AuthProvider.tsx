// src/contexts/AuthProvider.tsx
import {type ReactNode, useEffect, useState} from "react";
import {AuthContext} from "./useAuth";
import {
    apiGetMe,
    apiLogin as loginService,
    apiLogout as logoutService,
    apiSignup as signupService,
} from "@/services/authService";
import {getUserRoles} from "@/services/userService";
import type {UserModel} from "@/types/User.ts";
import {setLoggedOut} from "@/services/axios";

export function AuthProvider({children}: { children: ReactNode }) {
    const [user, setUser] = useState<UserModel | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const me = await apiGetMe();
                // getUserRoles
                const roles = await getUserRoles(me.uuid);
                me.role = roles?.[0] ?? null;
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
        try {
            // Immediately set the logged out flag to prevent token refresh
            setLoggedOut(true);

            // Create a timeout promise to ensure logout doesn't hang indefinitely
            const timeoutPromise = new Promise<void>((_, reject) => {
                setTimeout(() => reject(new Error("Logout request timed out")), 5000);
            });

            // Race between the actual logout request and the timeout
            await Promise.race([
                logoutService(),
                timeoutPromise
            ]);
        } catch (error) {
            console.error("Logout failed:", error);
            // Continue with local logout even if API call fails
        } finally {
            // Always clear local state regardless of API response
            sessionStorage.removeItem(import.meta.env.VITE_ACCESS_TOKEN_KEY);

            // Clear all authentication-related cookies
            // This is important to invalidate the refresh token
            document.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict; Secure";
            document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict; Secure";
            document.cookie = "connect.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict; Secure";

            // Update user state
            setUser(null);

            // Redirect to home page after logout
            window.location.href = "/";
        }
    };

    return (
        <AuthContext.Provider value={{user, loading, login, signup, logout}}>
            {children}
        </AuthContext.Provider>
    );
}
