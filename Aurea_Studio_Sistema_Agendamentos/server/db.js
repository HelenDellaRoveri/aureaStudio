import "dotenv/config";
import { neon } from "@neondatabase/serverless";

if(!process.env.DATABASE_URL){
  throw new Error("DATABASE_URL não configurada. Copie .env.example para .env e informe a conexão do Neon.");
}

export const sql=neon(process.env.DATABASE_URL);
