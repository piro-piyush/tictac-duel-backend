const PORT = Number(process.env.PORT) || 3000;

const HOST = process.env.HOST || "0.0.0.0";

const NODE_ENV = process.env.NODE_ENV || "development";

const POSTGRES_HOST = process.env.POSTGRES_HOST;

const POSTGRES_PORT = process.env.POSTGRES_PORT;

const POSTGRES_USER = process.env.POSTGRES_USER;

const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;

const POSTGRES_DB = process.env.POSTGRES_DB;

if (!POSTGRES_HOST) {
    throw new Error("POSTGRES_HOST is not defined");
}

if (!POSTGRES_PORT) {
    throw new Error("POSTGRES_PORT is not defined");
}

if (!POSTGRES_USER) {
    throw new Error("POSTGRES_USER is not defined");
}

if (!POSTGRES_PASSWORD) {
    throw new Error("POSTGRES_PASSWORD is not defined");
}

if (!POSTGRES_DB) {
    throw new Error("POSTGRES_DB is not defined");
}

export {
    HOST,
    NODE_ENV,
    PORT,
    POSTGRES_DB,
    POSTGRES_HOST,
    POSTGRES_PASSWORD,
    POSTGRES_PORT,
    POSTGRES_USER
};
