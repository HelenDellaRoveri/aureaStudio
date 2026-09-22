import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "./db.js";

const here=path.dirname(fileURLToPath(import.meta.url));
const schema=await fs.readFile(path.join(here,"../database/schema.sql"),"utf8");
const statements=schema.split(";").map(item=>item.trim()).filter(Boolean);
for(const statement of statements)await sql.query(statement,[]);
console.log("Banco Neon preparado com sucesso.");
