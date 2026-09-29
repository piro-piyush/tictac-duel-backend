const PORT = Number(process.env.PORT) || 3000;

const HOST = process.env.HOST || "0.0.0.0";

const NODE_ENV = process.env.NODE_ENV || "development";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
}

export {
    DATABASE_URL,
    HOST,
    NODE_ENV,
    PORT
};
