const getRequiredEnv = (key: string): string => {
    const value = process.env[key];

    if (!value) {
        throw new Error(`${key} is not defined`);
    }

    return value;
};

const PORT = Number(process.env.PORT) || 3000;

const HOST = process.env.HOST || "0.0.0.0";

const NODE_ENV = process.env.NODE_ENV || "development";

const POSTGRES_HOST = getRequiredEnv("POSTGRES_HOST");

const POSTGRES_PORT = getRequiredEnv("POSTGRES_PORT");

const POSTGRES_USER = getRequiredEnv("POSTGRES_USER");

const POSTGRES_PASSWORD = getRequiredEnv("POSTGRES_PASSWORD");

const POSTGRES_DB = getRequiredEnv("POSTGRES_DB");

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
