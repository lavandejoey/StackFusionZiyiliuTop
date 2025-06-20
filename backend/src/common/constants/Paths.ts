import {API_VERSION} from "@src/common/constants/ENV";

export default {
    Base: `/api/${API_VERSION}`,
    Auth:{
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
        GetByUuid: "/:uuid",
    },
} as const;
