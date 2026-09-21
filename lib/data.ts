import { Appointment, Professional, Service } from "./types";

export const categories = ["Cabelos", "Sobrancelhas", "Cílios", "Maquiagem", "Unhas", "Estética"];

export const services: Service[] = [
  { id:"s1", name:"Corte feminino", category:"Cabelos", description:"Consulta de estilo, corte personalizado e finalização.", duration:60, price:120, professionalIds:["p1"], active:true, icon:"Scissors" },
  { id:"s2", name:"Coloração premium", category:"Cabelos", description:"Coloração personalizada com tratamento protetor.", duration:150, price:320, professionalIds:["p1"], active:true, icon:"Sparkles" },
  { id:"s3", name:"Corte masculino", category:"Cabelos", description:"Corte, acabamento e styling.", duration:45, price:75, professionalIds:["p2"], active:true, icon:"Scissors" },
  { id:"s4", name:"Tratamento capilar", category:"Cabelos", description:"Diagnóstico dos fios, reconstrução e finalização.", duration:90, price:180, professionalIds:["p1","p2"], active:true, icon:"Droplets" },
  { id:"s5", name:"Design com henna", category:"Sobrancelhas", description:"Mapeamento facial e acabamento com henna.", duration:45, price:70, professionalIds:["p4"], active:true, icon:"Eye" },
  { id:"s6", name:"Brow lamination", category:"Sobrancelhas", description:"Alinhamento e definição de longa duração.", duration:60, price:150, professionalIds:["p4"], active:true, icon:"Eye" },
  { id:"s7", name:"Extensão clássica", category:"Cílios", description:"Aplicação fio a fio para um olhar elegante.", duration:120, price:210, professionalIds:["p4"], active:true, icon:"WandSparkles" },
  { id:"s8", name:"Maquiagem social", category:"Maquiagem", description:"Produção personalizada para eventos.", duration:75, price:190, professionalIds:["p5"], active:true, icon:"Palette" },
  { id:"s9", name:"Manicure em gel", category:"Unhas", description:"Cuidado completo com esmaltação em gel.", duration:75, price:95, professionalIds:["p3"], active:true, icon:"Gem" },
  { id:"s10", name:"Fibra de vidro", category:"Unhas", description:"Alongamento natural com acabamento preciso.", duration:180, price:260, professionalIds:["p3"], active:true, icon:"Gem" },
  { id:"s11", name:"Limpeza de pele", category:"Estética", description:"Higienização profunda e hidratação facial.", duration:90, price:180, professionalIds:["p6"], active:true, icon:"Flower2" },
  { id:"s12", name:"Massagem relaxante", category:"Estética", description:"Técnica corporal para aliviar tensões.", duration:60, price:160, professionalIds:["p6"], active:true, icon:"Heart" },
];

export const professionals: Professional[] = [
  { id:"p1", name:"Ana Martins", specialty:"Hair artist & colorista", description:"Especialista em cortes personalizados, coloração e saúde dos fios.", initials:"AM", tone:"rose", serviceIds:["s1","s2","s4"], active:true, workDays:[1,2,3,4,5,6], start:"09:00", end:"19:00" },
  { id:"p2", name:"Lucas Ferreira", specialty:"Barbeiro & visagista", description:"Cortes contemporâneos e cuidado masculino com precisão.", initials:"LF", tone:"charcoal", serviceIds:["s3","s4"], active:true, workDays:[2,3,4,5,6], start:"10:00", end:"20:00" },
  { id:"p3", name:"Camila Nunes", specialty:"Nail designer", description:"Alongamentos delicados e esmaltação de alta durabilidade.", initials:"CN", tone:"champagne", serviceIds:["s9","s10"], active:true, workDays:[1,2,3,4,5,6], start:"09:00", end:"18:00" },
  { id:"p4", name:"Bianca Alves", specialty:"Brow & lash designer", description:"Design harmônico para realçar a beleza natural do olhar.", initials:"BA", tone:"mocha", serviceIds:["s5","s6","s7"], active:true, workDays:[2,3,4,5,6], start:"09:00", end:"18:00" },
  { id:"p5", name:"Marina Costa", specialty:"Makeup artist", description:"Beleza sofisticada para eventos, ensaios e celebrações.", initials:"MC", tone:"wine", serviceIds:["s8"], active:true, workDays:[4,5,6], start:"10:00", end:"20:00" },
  { id:"p6", name:"Helena Prado", specialty:"Esteticista & massoterapeuta", description:"Protocolos faciais e corporais focados em bem-estar.", initials:"HP", tone:"olive", serviceIds:["s11","s12"], active:true, workDays:[1,2,3,4,5], start:"09:00", end:"18:00" },
];

const iso = (offset:number) => { const d=new Date(); d.setDate(d.getDate()+offset); return d.toISOString().slice(0,10); };
export const appointments: Appointment[] = [
  { id:"a1", client:"Hanna Oliveira", phone:"(41) 99912-3456", serviceId:"s1", professionalId:"p1", date:iso(2), time:"10:00", status:"Confirmado", notes:"Prefere corte em camadas." },
  { id:"a2", client:"Clara Mendes", phone:"(41) 98845-2331", serviceId:"s9", professionalId:"p3", date:iso(0), time:"14:00", status:"Agendado" },
  { id:"a3", client:"Isabela Lima", phone:"(41) 99771-8604", serviceId:"s11", professionalId:"p6", date:iso(0), time:"16:00", status:"Confirmado" },
  { id:"a4", client:"Renata Souza", phone:"(41) 99138-4450", serviceId:"s2", professionalId:"p1", date:iso(-4), time:"13:00", status:"Concluído" },
  { id:"a5", client:"Paula Ribeiro", phone:"(41) 98734-0981", serviceId:"s7", professionalId:"p4", date:iso(1), time:"09:30", status:"Agendado" },
];

export const clients = [
  { name:"Hanna Oliveira", phone:"(41) 99912-3456", email:"hanna@email.com", visits:8 },
  { name:"Clara Mendes", phone:"(41) 98845-2331", email:"clara@email.com", visits:5 },
  { name:"Isabela Lima", phone:"(41) 99771-8604", email:"isabela@email.com", visits:3 },
  { name:"Renata Souza", phone:"(41) 99138-4450", email:"renata@email.com", visits:11 },
  { name:"Paula Ribeiro", phone:"(41) 98734-0981", email:"paula@email.com", visits:2 },
];

