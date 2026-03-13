import { isDevEnv } from "@asko/shared";

const allowlist = process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000'

export const corsOptions = {
    origin: function(origin: any, callback: any) {
        // if (isDevEnv()) {
        //     return callback(null, true);
        // }

        if (!origin) {
            return callback(null, true);
        }

        if (allowlist.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    exposedHeaders: ["WWW-Authenticate"],
    AllowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200
};
