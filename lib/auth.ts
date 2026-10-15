import { betterAuth } from "better-auth";
import { prisma } from "@/lib/prisma";
import { prismaAdapter } from "better-auth/adapters/prisma";

const baseURL = process.env.BETTER_AUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000";
const developmentSecret = "iwe-local-development-secret-change-before-production";
const developmentOrigins = process.env.NODE_ENV === "development"
  ? Array.from({ length: 11 }, (_, index) => `http://localhost:${3000 + index}`)
  : [];

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET ?? developmentSecret,
  emailAndPassword: { enabled: true, minPasswordLength: 10 },
  // Next chooses the next free port in development; production only trusts APP_URL.
  trustedOrigins: [baseURL, ...developmentOrigins],
});
