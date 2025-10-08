import {API_VERSION} from "@src/common/constants/ENV";

const BASE = `/api/${API_VERSION}`;

export const ENDPOINTS = {
    base: BASE,

    auth: {
        base: "/auth",
        // POST /api/${API_VERSION}/auth/login?email=${email}&password=${password}
        login: "/login",
        // POST /api/${API_VERSION}/auth/login?email=${email}&password=${password}
        logout: "/logout",
        // POST /api/${API_VERSION}/auth/refresh
        refreshToken: "/refresh",
        // GET /api/${API_VERSION}/auth/me
        me: "/me",
        // POST /api/${API_VERSION}/auth/signup?
        // email=${email}&password=${password}&first_name=${first_name}&last_name=${last_name}
        signup: "/signup",
        // GET /api/${API_VERSION}/auth/exists?email=${email}
        // GET /api/${API_VERSION}/auth/exists?uuid=${uuid}
        exists: "/exists",
    },

    users: {
        base: "/users",
        // POST /api/${API_VERSION}/users TODO
        // POST /api/${API_VERSION}/users/all TODO
        list: ["/", "/all"],
        // GET /api/${API_VERSION}/users/:uuid
        getByUuid: "/:uuid",
        // GET /api/${API_VERSION}/users/:email TODO
        getByEmail: "/:email",

        // GET /api/${API_VERSION}/users/:uuid/roles
        listRolesByUserUuid: "/:uuid/roles",
    },

    contacts: {
        base: "/contacts",
        // POST /api/${API_VERSION}/contacts/send_mail
        submit: "/send_mail",
    },

    blogs: {
        base: "/blogs",
        // GET /api/${API_VERSION}/blogs
        homeList: "/",
        // GET /api/${API_VERSION}/blogs/pages/:id
        pages: "/pages/:id",
        // GET /api/${API_VERSION}/blogs/pages/:id/parents
        parents: "/pages/:id/parents",
        // GET /api/${API_VERSION}/blogs/blocks/:block_id/children
        blockChildren: "/blocks/:block_id/children",
        // GET /api/${API_VERSION}/blogs/database/:id
        database: "/database/:id",
        // POST /api/${API_VERSION}/blogs/database/:id/query
        queryDatabase: "/database/:id/query",
    },

    proxy: {
        base: "/proxy",
        // GET /api/v1/proxy/config?email=xxx@xxx.com
        config: "/config",
    },

    repos: {
        base: "/repos",
        // GET /api/${API_VERSION}/repos
        all: "/",
    },

    analytics: {
        base: "/analytics",
        track: "/track",
        briefing: "/briefing",
    },
} as const;
