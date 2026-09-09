import { PrismaClient, type Prisma } from "@prisma/client";
import "dotenv/config";

const configuredUrl = process.env.DATABASE_URL;
if (!configuredUrl) throw new Error("DATABASE_URL is not defined");
const url = new URL(configuredUrl);
// Preserve explicit deployment settings and never print the connection URL.
if (!url.searchParams.has("connect_timeout")) url.searchParams.set("connect_timeout", "15");
if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "15");
const databaseUrl = url.toString();
const transactionOptions = { maxWait: 15000, timeout: 15000 };


export const prisma = new PrismaClient({ datasourceUrl: databaseUrl, transactionOptions });
export type DatabaseTransaction = Prisma.TransactionClient;
