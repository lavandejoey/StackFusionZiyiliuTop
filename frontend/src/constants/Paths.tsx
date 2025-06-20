// src/constants/Paths.ts
// Mirrors your backend Paths, using the VITE_API_VERSION env var.

const Paths = {
    Base: `/api/${import.meta.env.VITE_API_VERSION}`,

    Auth: {
        Base: "/auth",
        Login: "/login",
        Logout: "/logout",
        Refresh: "/refresh",
        Me: "/me",
        Signup: "/signup",
        Exists: "/exists",
    },

    Proxy: {
        Base: "/proxy",
    },

    Contact: {
        Base: "/contact",
    },

    Blog: {
        Base: "/blog",
        GetAll: "/all",
    },

    Users: {
        Base: "/users",
    },
} as const;

export default Paths;
