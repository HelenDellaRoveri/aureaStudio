import bcrypt from "bcryptjs";
import { sql } from "./db.js";

const PROFESSIONAL_PASSWORD = "Profissional@2026";
const CLIENT_PASSWORD = "Cliente@2026";

const services = [
  {
    id: "srv-corte-curto",
    name: "Corte Curto",
    category: "Cabelos",
    description: "Corte personalizado para comprimentos curtos, com acabamento e finalização.",
    duration: 45,
    price: 85,
    icon: "Scissors",
  },
  {
    id: "srv-corte-medio",
    name: "Corte Médio",
    category: "Cabelos",
    description: "Corte personalizado para cabelos de comprimento médio, com finalização.",
    duration: 60,
    price: 105,
    icon: "Scissors",
  },
  {
    id: "srv-corte-longo",
    name: "Corte Longo",
    category: "Cabelos",
    description: "Corte personalizado para cabelos longos, incluindo tratamento e finalização.",
    duration: 75,
    price: 125,
    icon: "Scissors",
  },
  {
    id: "srv-cachos",
    name: "Corte e Definição de Cachos",
    category: "Cabelos",
    description: "Corte especializado com técnicas de definição, hidratação e finalização de cachos.",
    duration: 90,
    price: 145,
    icon: "Scissors",
  },
  {
    id: "srv-franja",
    name: "Franja e Acabamento",
    category: "Cabelos",
    description: "Ajuste de franja, contornos e acabamento personalizado.",
    duration: 30,
    price: 55,
    icon: "Scissors",
  },
  {
    id: "srv-escova",
    name: "Escova Modeladora",
    category: "Cabelos",
    description: "Modelagem dos fios com proteção térmica e acabamento profissional.",
    duration: 60,
    price: 90,
    icon: "Sparkles",
  },
  {
    id: "srv-coloracao",
    name: "Coloração Premium",
    category: "Cabelos",
    description: "Coloração personalizada com diagnóstico e tratamento protetor.",
    duration: 150,
    price: 320,
    icon: "Sparkles",
  },
  {
    id: "srv-mechas",
    name: "Mechas Iluminadas",
    category: "Cabelos",
    description: "Técnica de iluminação personalizada com tratamento pós-química.",
    duration: 240,
    price: 490,
    icon: "Sparkles",
  },
  {
    id: "srv-tonalizacao",
    name: "Tonalização",
    category: "Cabelos",
    description: "Correção ou renovação da tonalidade com brilho e tratamento.",
    duration: 90,
    price: 180,
    icon: "Sparkles",
  },
  {
    id: "srv-hidratacao",
    name: "Hidratação Profunda",
    category: "Cabelos",
    description: "Tratamento intensivo para reposição de água, maciez e brilho.",
    duration: 60,
    price: 120,
    icon: "Droplets",
  },
  {
    id: "srv-reconstrucao",
    name: "Reconstrução Capilar",
    category: "Cabelos",
    description: "Reposição de proteínas e fortalecimento de fios danificados.",
    duration: 75,
    price: 160,
    icon: "Heart",
  },
  {
    id: "srv-couro-cabeludo",
    name: "Tratamento do Couro Cabeludo",
    category: "Cabelos",
    description: "Avaliação e tratamento para oleosidade, ressecamento ou sensibilidade.",
    duration: 75,
    price: 175,
    icon: "Leaf",
  },
  {
    id: "srv-penteado",
    name: "Penteado Social",
    category: "Cabelos",
    description: "Penteado personalizado para festas, formaturas e eventos.",
    duration: 90,
    price: 190,
    icon: "Crown",
  },
  {
    id: "srv-maquiagem",
    name: "Maquiagem Social",
    category: "Maquiagem",
    description: "Maquiagem personalizada com preparação de pele e acabamento de longa duração.",
    duration: 75,
    price: 180,
    icon: "Sparkles",
  },
  {
    id: "srv-sobrancelhas",
    name: "Design de Sobrancelhas",
    category: "Sobrancelhas",
    description: "Mapeamento facial, modelagem e acabamento das sobrancelhas.",
    duration: 45,
    price: 70,
    icon: "Eye",
  },
  {
    id: "srv-brow-lamination",
    name: "Brow Lamination",
    category: "Sobrancelhas",
    description: "Alinhamento e definição dos fios para sobrancelhas mais preenchidas.",
    duration: 60,
    price: 130,
    icon: "Eye",
  },
  {
    id: "srv-extensao-cilios",
    name: "Extensão de Cílios",
    category: "Cílios",
    description: "Aplicação personalizada de extensão de cílios com acabamento natural.",
    duration: 150,
    price: 220,
    icon: "Eye",
  },
  {
    id: "srv-lash-lifting",
    name: "Lash Lifting",
    category: "Cílios",
    description: "Curvatura, alinhamento e hidratação dos cílios naturais.",
    duration: 75,
    price: 150,
    icon: "Eye",
  },
  {
    id: "srv-manicure",
    name: "Manicure Clássica",
    category: "Unhas",
    description: "Cuidado completo das unhas das mãos com esmaltação.",
    duration: 60,
    price: 55,
    icon: "Hand",
  },
  {
    id: "srv-pedicure",
    name: "Pedicure",
    category: "Unhas",
    description: "Cuidado completo das unhas dos pés com esmaltação.",
    duration: 60,
    price: 65,
    icon: "Footprints",
  },
  {
    id: "srv-alongamento-gel",
    name: "Alongamento em Gel",
    category: "Unhas",
    description: "Alongamento personalizado em gel com acabamento e esmaltação.",
    duration: 150,
    price: 210,
    icon: "Gem",
  },
  {
    id: "srv-limpeza-pele",
    name: "Limpeza de Pele",
    category: "Estética",
    description: "Higienização profunda, esfoliação, extração e hidratação facial.",
    duration: 90,
    price: 170,
    icon: "Sparkles",
  },
  {
    id: "srv-massagem",
    name: "Massagem Relaxante",
    category: "Estética",
    description: "Massagem corporal para relaxamento, redução de tensão e bem-estar.",
    duration: 60,
    price: 160,
    icon: "Heart",
  },
];

const professionals = [
  {
    id: "prof-marina-alves",
    name: "Marina Alves",
    email: "marina@aureastudio.com.br",
    phone: "(41) 99101-1001",
    specialty: "Cortes e finalização",
    description: "Especialista em visagismo, cortes personalizados e finalização.",
    initials: "MA",
    tone: "rose",
    serviceIds: [
      "srv-corte-curto",
      "srv-corte-medio",
      "srv-corte-longo",
      "srv-cachos",
      "srv-franja",
      "srv-escova",
      "srv-hidratacao",
    ],
    workDays: [1, 2, 3, 4, 5],
    start: "09:00",
    end: "18:00",
  },
  {
    id: "prof-rafael-costa",
    name: "Rafael Costa",
    email: "rafael@aureastudio.com.br",
    phone: "(41) 99101-1002",
    specialty: "Coloração e tratamentos",
    description: "Colorista especializado em transformação, iluminação e saúde capilar.",
    initials: "RC",
    tone: "olive",
    serviceIds: [
      "srv-coloracao",
      "srv-mechas",
      "srv-tonalizacao",
      "srv-hidratacao",
      "srv-reconstrucao",
      "srv-couro-cabeludo",
    ],
    workDays: [2, 3, 4, 5, 6],
    start: "10:00",
    end: "19:00",
  },
  {
    id: "prof-camila-rocha",
    name: "Camila Rocha",
    email: "camila@aureastudio.com.br",
    phone: "(41) 99101-1003",
    specialty: "Sobrancelhas e cílios",
    description: "Especialista em design do olhar e técnicas de embelezamento natural.",
    initials: "CR",
    tone: "gold",
    serviceIds: [
      "srv-sobrancelhas",
      "srv-brow-lamination",
      "srv-extensao-cilios",
      "srv-lash-lifting",
    ],
    workDays: [1, 2, 3, 4, 5, 6],
    start: "09:00",
    end: "18:00",
  },
  {
    id: "prof-bruno-lima",
    name: "Bruno Lima",
    email: "bruno@aureastudio.com.br",
    phone: "(41) 99101-1004",
    specialty: "Nail design",
    description: "Especialista em cuidados das unhas e alongamentos em gel.",
    initials: "BL",
    tone: "dark",
    serviceIds: [
      "srv-manicure",
      "srv-pedicure",
      "srv-alongamento-gel",
    ],
    workDays: [1, 3, 4, 5, 6],
    start: "09:00",
    end: "18:00",
  },
  {
    id: "prof-juliana-martins",
    name: "Juliana Martins",
    email: "juliana@aureastudio.com.br",
    phone: "(41) 99101-1005",
    specialty: "Estética e bem-estar",
    description: "Esteticista especializada em cuidados faciais e terapias relaxantes.",
    initials: "JM",
    tone: "rose",
    serviceIds: [
      "srv-limpeza-pele",
      "srv-massagem",
    ],
    workDays: [2, 3, 4, 5, 6],
    start: "10:00",
    end: "19:00",
  },
  {
    id: "prof-lucas-ferreira",
    name: "Lucas Ferreira",
    email: "lucas@aureastudio.com.br",
    phone: "(41) 99101-1006",
    specialty: "Maquiagem e penteados",
    description: "Especialista em produções para festas, eventos e ocasiões especiais.",
    initials: "LF",
    tone: "olive",
    serviceIds: [
      "srv-penteado",
      "srv-maquiagem",
      "srv-escova",
    ],
    workDays: [1, 2, 4, 5, 6],
    start: "10:00",
    end: "19:00",
  },
];

const clientNames = [
  "Alice Oliveira",
  "Ana Clara Santos",
  "Beatriz Mendes",
  "Bianca Carvalho",
  "Brenda Ribeiro",
  "Camila Fernandes",
  "Carolina Martins",
  "Daniela Rocha",
  "Eduarda Lima",
  "Fernanda Souza",
  "Gabriela Costa",
  "Helena Barbosa",
  "Isabela Cardoso",
  "Juliana Moreira",
  "Larissa Almeida",
  "Letícia Nascimento",
  "Luana Teixeira",
  "Mariana Freitas",
  "Natália Correia",
  "Patrícia Lopes",
  "Rafaela Gonçalves",
  "Renata Vieira",
  "Sabrina Moraes",
  "Vanessa Castro",
  "Vitória Monteiro",
  "André Oliveira",
  "Bruno Santos",
  "Caio Mendes",
  "Carlos Carvalho",
  "Daniel Ribeiro",
  "Diego Fernandes",
  "Eduardo Martins",
  "Felipe Rocha",
  "Gabriel Lima",
  "Gustavo Souza",
  "Henrique Costa",
  "João Barbosa",
  "Leonardo Cardoso",
  "Lucas Moreira",
  "Marcelo Almeida",
  "Marcos Nascimento",
  "Mateus Teixeira",
  "Nicolas Freitas",
  "Paulo Correia",
  "Pedro Lopes",
  "Rafael Gonçalves",
  "Ricardo Vieira",
  "Thiago Moraes",
  "Vinícius Castro",
  "William Monteiro",
];

const clients = clientNames.map((name, index) => ({
  name,
  email: `cliente${String(index + 1).padStart(2, "0")}@aureastudio.com.br`,
  phone: `(41) 99${String(index + 1).padStart(3, "0")}-${String(
    2000 + index + 1,
  ).padStart(4, "0")}`,
}));

async function insertServices() {
  for (const service of services) {
    await sql`
      INSERT INTO services (
        id,
        name,
        category,
        description,
        duration_minutes,
        price_cents,
        icon,
        active
      )
      VALUES (
        ${service.id},
        ${service.name},
        ${service.category},
        ${service.description},
        ${service.duration},
        ${Math.round(service.price * 100)},
        ${service.icon},
        TRUE
      )
      ON CONFLICT (id)
      DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        duration_minutes = EXCLUDED.duration_minutes,
        price_cents = EXCLUDED.price_cents,
        icon = EXCLUDED.icon,
        active = TRUE,
        updated_at = NOW()
    `;
  }
}

async function insertProfessionals() {
  const passwordHash = await bcrypt.hash(PROFESSIONAL_PASSWORD, 12);

  for (const professional of professionals) {
    await sql`
      INSERT INTO professionals (
        id,
        name,
        specialty,
        description,
        initials,
        tone,
        service_ids,
        active,
        work_days,
        start_time,
        end_time
      )
      VALUES (
        ${professional.id},
        ${professional.name},
        ${professional.specialty},
        ${professional.description},
        ${professional.initials},
        ${professional.tone},
        ${JSON.stringify(professional.serviceIds)}::jsonb,
        TRUE,
        ${JSON.stringify(professional.workDays)}::jsonb,
        ${professional.start}::time,
        ${professional.end}::time
      )
      ON CONFLICT (id)
      DO UPDATE SET
        name = EXCLUDED.name,
        specialty = EXCLUDED.specialty,
        description = EXCLUDED.description,
        initials = EXCLUDED.initials,
        tone = EXCLUDED.tone,
        service_ids = EXCLUDED.service_ids,
        active = TRUE,
        work_days = EXCLUDED.work_days,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        updated_at = NOW()
    `;

    await sql`
      INSERT INTO users (
        name,
        email,
        phone,
        password_hash,
        role,
        professional_id
      )
      VALUES (
        ${professional.name},
        ${professional.email},
        ${professional.phone},
        ${passwordHash},
        'professional',
        ${professional.id}
      )
      ON CONFLICT (email)
      DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        password_hash = EXCLUDED.password_hash,
        role = 'professional',
        professional_id = EXCLUDED.professional_id,
        updated_at = NOW()
    `;
  }
}

async function insertClients() {
  const passwordHash = await bcrypt.hash(CLIENT_PASSWORD, 12);

  for (const client of clients) {
    await sql`
      INSERT INTO users (
        name,
        email,
        phone,
        password_hash,
        role,
        professional_id
      )
      VALUES (
        ${client.name},
        ${client.email},
        ${client.phone},
        ${passwordHash},
        'client',
        NULL
      )
      ON CONFLICT (email)
      DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        password_hash = EXCLUDED.password_hash,
        role = 'client',
        professional_id = NULL,
        updated_at = NOW()
    `;
  }
}

async function seed() {
  console.log("Iniciando cadastro dos dados...");

  await insertServices();
  console.log(`${services.length} serviços cadastrados.`);

  await insertProfessionals();
  console.log(`${professionals.length} profissionais cadastrados.`);

  await insertClients();
  console.log(`${clients.length} clientes cadastrados.`);

  console.log("Dados cadastrados com sucesso.");
  console.log(`Senha dos profissionais: ${PROFESSIONAL_PASSWORD}`);
  console.log(`Senha dos clientes: ${CLIENT_PASSWORD}`);
}

seed()
  .catch((error) => {
    console.error("Erro ao cadastrar dados:", error);
    process.exitCode = 1;
  });