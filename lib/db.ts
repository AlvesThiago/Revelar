import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/lib/schema";

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL não configurada. Copie .env.example para .env.local e cole a string do Neon."
    );
  }
  return url;
}

const sql = neon(getDatabaseUrl());

export const db = drizzle({ client: sql, schema });
