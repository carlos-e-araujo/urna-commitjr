import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import candidatesData from "../../data/seed-candidatos.json";
import { eq } from "drizzle-orm";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ ERRO: DATABASE_URL não definida nas variáveis de ambiente (.env ou .env.local).");
    process.exit(1);
  }

  console.log("🌱 Iniciando seed do banco de dados...");
  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  // 1. Cria ou recupera Eleição Ativa Padrão
  const defaultElectionTitle = "Eleição Diretoria Executiva Commit Jr. 2026";
  const existingElections = await db
    .select()
    .from(schema.elections)
    .where(eq(schema.elections.title, defaultElectionTitle))
    .limit(1);

  let electionId: string;

  if (existingElections.length === 0) {
    console.log(`🗳️  Criando eleição padrão: "${defaultElectionTitle}"...`);
    const [newElection] = await db
      .insert(schema.elections)
      .values({
        title: defaultElectionTitle,
        status: "OPEN",
        openedAt: new Date(),
      })
      .returning();

    electionId = newElection.id;
    console.log(`✅ Eleição criada com ID: ${electionId}`);
  } else {
    electionId = existingElections[0].id;
    console.log(`ℹ️  Eleição existente encontrada com ID: ${electionId}`);
  }

  // 2. Insere os candidatos do seed
  console.log(`👥 Inserindo candidatos iniciais (${candidatesData.length} encontrados)...`);

  for (const item of candidatesData) {
    const existing = await db
      .select()
      .from(schema.candidates)
      .where(eq(schema.candidates.electionId, electionId));

    const alreadyExists = existing.some(
      (c) => c.number === item.numero && c.role === item.cargo
    );

    if (!alreadyExists) {
      const [inserted] = await db
        .insert(schema.candidates)
        .values({
          electionId,
          name: item.nome,
          number: item.numero,
          role: item.cargo,
          photoUrl: item.foto_url,
        })
        .returning();
      console.log(`  ➕ Candidato cadastrado: [${inserted.number}] ${inserted.name} (${inserted.role})`);
    } else {
      console.log(`  ℹ️  Candidato já cadastrado: [${item.numero}] ${item.nome} (${item.cargo})`);
    }
  }

  console.log("🎉 Seed finalizado com sucesso!");
}

main().catch((err) => {
  console.error("❌ Erro fatal durante a execução do seed:", err);
  process.exit(1);
});
