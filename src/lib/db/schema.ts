import { pgTable, uuid, varchar, timestamp, pgEnum, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const electionStatusEnum = pgEnum("election_status", ["DRAFT", "OPEN", "CLOSED"]);

// 5.1. Elections Table
export const elections = pgTable("elections", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  status: electionStatusEnum("status").notNull().default("DRAFT"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

// 5.2. Candidates Table
export const candidates = pgTable(
  "candidates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    electionId: uuid("election_id")
      .references(() => elections.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    number: varchar("number", { length: 5 }).notNull(),
    role: varchar("role", { length: 255 }).notNull(),
    photoUrl: varchar("photo_url", { length: 512 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    electionIdx: index("candidates_election_idx").on(table.electionId),
    electionNumberRoleIdx: uniqueIndex("candidates_election_number_role_idx").on(
      table.electionId,
      table.number,
      table.role
    ),
  })
);

// 5.3. Votes Table (Sigilo estrito: sem correlação com eleitor)
export const votes = pgTable(
  "votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    electionId: uuid("election_id")
      .references(() => elections.id, { onDelete: "cascade" })
      .notNull(),
    candidateId: uuid("candidate_id").references(() => candidates.id, { onDelete: "set null" }),
    role: varchar("role", { length: 255 }).notNull(),
    isBlank: boolean("is_blank").default(false).notNull(),
    isNull: boolean("is_null").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    electionIdx: index("votes_election_idx").on(table.electionId),
    candidateIdx: index("votes_candidate_idx").on(table.candidateId),
    roleIdx: index("votes_role_idx").on(table.role),
  })
);

// 5.4. Voter Records Table (Auditoria e Controle de Voto Único)
export const voterRecords = pgTable(
  "voter_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    electionId: uuid("election_id")
      .references(() => elections.id, { onDelete: "cascade" })
      .notNull(),
    voterSignature: varchar("voter_signature", { length: 255 }).notNull(),
    votedAt: timestamp("voted_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    electionVoterIdx: uniqueIndex("voter_records_election_signature_idx").on(
      table.electionId,
      table.voterSignature
    ),
  })
);

// Relations
export const electionsRelations = relations(elections, ({ many }) => ({
  candidates: many(candidates),
  votes: many(votes),
  voterRecords: many(voterRecords),
}));

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  election: one(elections, {
    fields: [candidates.electionId],
    references: [elections.id],
  }),
  votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  election: one(elections, {
    fields: [votes.electionId],
    references: [elections.id],
  }),
  candidate: one(candidates, {
    fields: [votes.candidateId],
    references: [candidates.id],
  }),
}));

export const voterRecordsRelations = relations(voterRecords, ({ one }) => ({
  election: one(elections, {
    fields: [voterRecords.electionId],
    references: [elections.id],
  }),
}));
