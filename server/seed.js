import bcrypt from "bcryptjs";
import { sql } from "./db.js";

const accounts=[
  {name:"Helena Silva",email:"admin@aureastudio.com.br",phone:"(41) 3333-2026",password:"Aurea@2026",role:"admin",professionalId:null},
  {name:"Ana Martins",email:"ana@aureastudio.com.br",phone:"(41) 99999-0101",password:"Profissional@2026",role:"professional",professionalId:"p1"},
  {name:"Cliente Demonstração",email:"cliente@aureastudio.com.br",phone:"(41) 99999-0202",password:"Cliente@2026",role:"client",professionalId:null},
];

const professionals=[
 {id:"p1",name:"Ana Martins",specialty:"Hair artist & colorista",description:"Especialista em cortes personalizados, coloração e saúde dos fios.",initials:"AM",tone:"rose",serviceIds:["s1","s2","s4"],workDays:[1,2,3,4,5,6],start:"09:00",end:"19:00"},
 {id:"p2",name:"Lucas Ferreira",specialty:"Barbeiro & visagista",description:"Cortes contemporâneos e cuidado masculino com precisão.",initials:"LF",tone:"charcoal",serviceIds:["s3","s4"],workDays:[2,3,4,5,6],start:"10:00",end:"20:00"},
 {id:"p3",name:"Camila Nunes",specialty:"Nail designer",description:"Alongamentos delicados e esmaltação de alta durabilidade.",initials:"CN",tone:"champagne",serviceIds:["s9","s10"],workDays:[1,2,3,4,5,6],start:"09:00",end:"18:00"},
 {id:"p4",name:"Bianca Alves",specialty:"Brow & lash designer",description:"Design harmônico para realçar a beleza natural do olhar.",initials:"BA",tone:"mocha",serviceIds:["s5","s6","s7"],workDays:[2,3,4,5,6],start:"09:00",end:"18:00"},
 {id:"p5",name:"Marina Costa",specialty:"Makeup artist",description:"Beleza sofisticada para eventos, ensaios e celebrações.",initials:"MC",tone:"wine",serviceIds:["s8"],workDays:[4,5,6],start:"10:00",end:"20:00"},
 {id:"p6",name:"Helena Prado",specialty:"Esteticista & massoterapeuta",description:"Protocolos faciais e corporais focados em bem-estar.",initials:"HP",tone:"olive",serviceIds:["s11","s12"],workDays:[1,2,3,4,5],start:"09:00",end:"18:00"},
];

for(const professional of professionals){
 await sql`INSERT INTO professionals (id,name,specialty,description,initials,tone,service_ids,work_days,start_time,end_time)
 VALUES (${professional.id},${professional.name},${professional.specialty},${professional.description},${professional.initials},${professional.tone},${JSON.stringify(professional.serviceIds)}::jsonb,${JSON.stringify(professional.workDays)}::jsonb,${professional.start}::time,${professional.end}::time)
 ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,specialty=EXCLUDED.specialty,description=EXCLUDED.description,initials=EXCLUDED.initials,tone=EXCLUDED.tone,service_ids=EXCLUDED.service_ids,work_days=EXCLUDED.work_days,start_time=EXCLUDED.start_time,end_time=EXCLUDED.end_time,updated_at=NOW()`;
}

for(const account of accounts){
 const hash=await bcrypt.hash(account.password,12);
 await sql`INSERT INTO users (name,email,phone,password_hash,role,professional_id)
   VALUES (${account.name},${account.email},${account.phone},${hash},${account.role},${account.professionalId})
   ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name, phone=EXCLUDED.phone, password_hash=EXCLUDED.password_hash, role=EXCLUDED.role, professional_id=EXCLUDED.professional_id, updated_at=NOW()`;
}
console.log("Profissionais e contas de demonstração criados. Consulte o README para os acessos.");
