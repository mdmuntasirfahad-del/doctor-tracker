import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin } from "better-auth/plugins";
import { MongoClient } from "mongodb";
import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().trim().min(1, "MONGODB_URI is required."),
  MONGODB_DB: z.string().trim().min(1).default("doctor_tracker"),
  BETTER_AUTH_SECRET: z
    .string()
    .trim()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters."),
  BETTER_AUTH_URL: z.string().trim().url("BETTER_AUTH_URL must be a valid URL."),
  CORS_ORIGINS: z.string().trim().optional(),
});

const parsed = envSchema.safeParse({
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_DB: process.env.MONGODB_DB,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  CORS_ORIGINS: process.env.CORS_ORIGINS,
});

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid authentication environment: ${details}`);
}

export const authEnv = parsed.data;

const trustedOrigins = Array.from(
  new Set([
    authEnv.BETTER_AUTH_URL,
    ...(authEnv.CORS_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  ]),
);

const globalForAuth = globalThis;

if (!globalForAuth.__doctorTrackerMongoClient) {
  globalForAuth.__doctorTrackerMongoClient = new MongoClient(authEnv.MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 8000,
  });
}

export const mongoClient = globalForAuth.__doctorTrackerMongoClient;
export const db = mongoClient.db(authEnv.MONGODB_DB);

function createAuth() {
  return betterAuth({
    appName: "Doctor Tracker",
    baseURL: authEnv.BETTER_AUTH_URL,
    secret: authEnv.BETTER_AUTH_SECRET,
    database: mongodbAdapter(db, { client: mongoClient }),
    trustedOrigins,
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      requireEmailVerification: false,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
    },
    plugins: [admin({ defaultRole: "user", adminRoles: ["admin"] })],
    advanced: {
      useSecureCookies:
        process.env.NODE_ENV === "production" && authEnv.BETTER_AUTH_URL.startsWith("https://"),
    },
  });
}

export const auth = globalForAuth.__doctorTrackerAuth ?? createAuth();

if (process.env.NODE_ENV !== "production") {
  globalForAuth.__doctorTrackerAuth = auth;
}

export function getDb() {
  return db;
}

export async function closeAuthConnection() {
  await mongoClient.close();
}
