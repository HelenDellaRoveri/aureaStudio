import bcrypt from "bcryptjs";
import { sql } from "./db.js";

const accounts = [
  {
    name: "Helena Silva",
    email: "admin@aureastudio.com.br",
    phone: "(41) 3333-2026",
    password: "Aurea@2026",
    role: "admin",
    professionalId: null,
  }
];

// Remove exclusivamente os seis perfis demonstrativos das versões anteriores.
await sql`DELETE FROM professionals WHERE id IN ('p1','p2','p3','p4','p5','p6')`;

for (const account of accounts) {
  const hash = await bcrypt.hash(account.password, 12);
  await sql`INSERT INTO users (name,email,phone,password_hash,role,professional_id)
   VALUES (${account.name},${account.email},${account.phone},${hash},${account.role},${account.professionalId})
   ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name, phone=EXCLUDED.phone, password_hash=EXCLUDED.password_hash, role=EXCLUDED.role, professional_id=EXCLUDED.professional_id, updated_at=NOW()`;
}
console.log(
  "Somente o admin foi mantido. Os dados demonstrativos foram removidos.",
);
