import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export function cleanConnectionString(val?: string | null): string | null {
  if (!val) return null;
  let cleaned = String(val).trim();
  let changed = true;
  while (changed && cleaned.length >= 2) {
    changed = false;
    if (
      (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'")) ||
      (cleaned.startsWith("`") && cleaned.endsWith("`"))
    ) {
      cleaned = cleaned.slice(1, -1).trim();
      changed = true;
    }
  }
  return cleaned.length > 0 ? cleaned : null;
}

let cachedDb: ReturnType<typeof drizzle<typeof schema>> | null = null;
let lastUrl: string | null = null;

export function getDb() {
  const rawUrl = process.env.DATABASE_URL;
  const cleanedUrl = cleanConnectionString(rawUrl);

  if (cachedDb && lastUrl === cleanedUrl) {
    return cachedDb;
  }

  if (!cleanedUrl || cleanedUrl.includes("dummy") || cleanedUrl.includes("localhost")) {
    return drizzle(neon("postgresql://dummy:dummy@localhost:5432/dummy"), {
      schema,
    });
  }

  const sql = neon(cleanedUrl);
  cachedDb = drizzle(sql, { schema });
  lastUrl = cleanedUrl;
  return cachedDb;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    const client = getDb();
    const val = (client as any)[prop];
    if (typeof val === "function") {
      return val.bind(client);
    }
    return val;
  },
});

export * from "./schema";

