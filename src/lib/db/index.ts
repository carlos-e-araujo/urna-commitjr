import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Configuração Neon Client

const connectionString = process.env.DATABASE_URL;

function createDbClient() {
  if (!connectionString) {
    // Retorna proxy seguro para builds/types sem falhar na compilação se a env não estiver preenchida
    return drizzle(neon("postgresql://dummy:dummy@localhost:5432/dummy"), {
      schema,
    });
  }
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

export const db = createDbClient();
export * from "./schema";
