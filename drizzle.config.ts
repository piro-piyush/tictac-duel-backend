import "dotenv/config";

import { defineConfig } from "drizzle-kit";

const getRequiredEnv = (key: string): string => {
    const value = process.env[key];

    if (!value) {
        throw new Error(`${key} is not defined`);
    }

    return value;
};

const POSTGRES_HOST = getRequiredEnv("POSTGRES_HOST");
const POSTGRES_PORT = getRequiredEnv("POSTGRES_PORT");
const POSTGRES_USER = getRequiredEnv("POSTGRES_USER");
const POSTGRES_PASSWORD = getRequiredEnv("POSTGRES_PASSWORD");
const POSTGRES_DB = getRequiredEnv("POSTGRES_DB");

const databaseUrl =
    `postgresql://${encodeURIComponent(POSTGRES_USER)}` +
    `:${encodeURIComponent(POSTGRES_PASSWORD)}` +
    `@${POSTGRES_HOST}:${POSTGRES_PORT}` +
    `/${POSTGRES_DB}`;

console.log("Database configuration:");
console.log(`  Host     : ${POSTGRES_HOST}`);
console.log(`  Port     : ${POSTGRES_PORT}`);
console.log(`  User     : ${POSTGRES_USER}`);
console.log(`  Database : ${POSTGRES_DB}`);
console.log(`  Password : ${POSTGRES_PASSWORD ? "[SET]" : "[NOT SET]"}`);
console.log(`  URL      : ${databaseUrl.replace(
    encodeURIComponent(POSTGRES_PASSWORD),
    "********",
)}`);

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dbCredentials: {
        url: databaseUrl,
    },
    verbose: true,
    strict: true,
});