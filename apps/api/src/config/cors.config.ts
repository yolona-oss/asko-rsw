const allowlist = process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000'

export const corsOptions = {
    origin: function(origin: any, callback: any) {
        // console.log("origin", origin)
        if (allowlist.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    exposedHeaders: ["WWW-Authenticate"],
    AllowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200
};
