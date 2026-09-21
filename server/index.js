import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import { sql } from "./db.js";

const app=express();
const port=Number(process.env.PORT||3001);
const jwtSecret=process.env.JWT_SECRET;
if(!jwtSecret||jwtSecret.length<32)throw new Error("JWT_SECRET deve ter pelo menos 32 caracteres.");

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({origin:process.env.CLIENT_URL||"http://localhost:5173",credentials:true}));
app.use(express.json({limit:"100kb"}));
app.use(cookieParser());

const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const publicUser=row=>({id:row.id,name:row.name,email:row.email,phone:row.phone,role:row.role,professionalId:row.professional_id});
const publicProfessional=row=>({id:row.id,name:row.name,specialty:row.specialty,description:row.description,initials:row.initials,tone:row.tone,serviceIds:row.service_ids,active:row.active,workDays:row.work_days,start:row.start,end:row.end});
const publicBlock=row=>({id:row.id,professionalId:row.professional_id,date:row.date,reason:row.reason,wholeDay:row.whole_day,startTime:row.start_time,endTime:row.end_time});
const cookieOptions={httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:7*24*60*60*1000,path:"/"};
const issueSession=(res,user)=>res.cookie("aurea_token",jwt.sign({sub:user.id,role:user.role},jwtSecret,{expiresIn:"7d"}),cookieOptions);
const authLimiter=rateLimit({windowMs:15*60*1000,limit:30,standardHeaders:"draft-8",legacyHeaders:false,message:{message:"Muitas tentativas. Aguarde alguns minutos e tente novamente."}});

async function auth(req,res,next){
 try{
  const token=req.cookies.aurea_token;
  if(!token)return res.status(401).json({message:"Faça login para continuar."});
  const payload=jwt.verify(token,jwtSecret);
  const rows=await sql`SELECT id,name,email,phone,role,professional_id FROM users WHERE id=${payload.sub} LIMIT 1`;
  if(!rows[0])return res.status(401).json({message:"Sessão inválida."});
  req.user=rows[0];next();
 }catch{return res.status(401).json({message:"Sua sessão expirou. Entre novamente."})}
}

app.get("/api/health",async(_req,res)=>{await sql`SELECT 1`;res.json({ok:true})});

app.get("/api/professionals",async(_req,res,next)=>{
 try{const rows=await sql`SELECT id,name,specialty,description,initials,tone,service_ids,active,work_days,to_char(start_time,'HH24:MI') AS start,to_char(end_time,'HH24:MI') AS end FROM professionals ORDER BY created_at,name`;res.json({professionals:rows.map(publicProfessional)})}catch(error){next(error)}
});

app.get("/api/blocks",async(_req,res,next)=>{
 try{const rows=await sql`SELECT id::text,professional_id,to_char(block_date,'YYYY-MM-DD') AS date,reason,whole_day,to_char(start_time,'HH24:MI') AS start_time,to_char(end_time,'HH24:MI') AS end_time FROM schedule_blocks WHERE block_date>=CURRENT_DATE-INTERVAL '30 days' ORDER BY block_date,start_time`;res.json({blocks:rows.map(publicBlock)})}catch(error){next(error)}
});

app.post("/api/auth/register",authLimiter,async(req,res,next)=>{
 try{
  const name=String(req.body.name||"").trim();const phone=String(req.body.phone||"").trim();const email=String(req.body.email||"").trim().toLowerCase();const password=String(req.body.password||"");
  if(name.length<3||!emailPattern.test(email)||phone.length<8||password.length<8)return res.status(400).json({message:"Preencha nome, telefone, e-mail válido e uma senha de pelo menos 8 caracteres."});
  const existing=await sql`SELECT id FROM users WHERE email=${email} LIMIT 1`;
  if(existing[0])return res.status(409).json({message:"Este e-mail já está cadastrado."});
  const hash=await bcrypt.hash(password,12);
  const rows=await sql`INSERT INTO users (name,email,phone,password_hash,role) VALUES (${name},${email},${phone},${hash},'client') RETURNING id,name,email,phone,role,professional_id`;
  issueSession(res,rows[0]);res.status(201).json({user:publicUser(rows[0])});
 }catch(error){next(error)}
});

app.post("/api/auth/login",authLimiter,async(req,res,next)=>{
 try{
  const email=String(req.body.email||"").trim().toLowerCase();const password=String(req.body.password||"");const role=String(req.body.role||"");
  const rows=await sql`SELECT id,name,email,phone,password_hash,role,professional_id FROM users WHERE email=${email} LIMIT 1`;
  const user=rows[0];
  if(!user||!(await bcrypt.compare(password,user.password_hash)))return res.status(401).json({message:"E-mail ou senha incorretos."});
  if(user.role!==role)return res.status(403).json({message:"Este cadastro pertence a outro tipo de acesso."});
  issueSession(res,user);res.json({user:publicUser(user)});
 }catch(error){next(error)}
});

app.get("/api/auth/me",auth,(req,res)=>res.json({user:publicUser(req.user)}));
app.post("/api/auth/logout",(_req,res)=>{res.clearCookie("aurea_token",{path:"/"});res.json({ok:true})});

app.post("/api/professionals",auth,async(req,res,next)=>{
 try{
  if(req.user.role!=="admin")return res.status(403).json({message:"Somente o salão pode cadastrar profissionais."});
  const name=String(req.body.name||"").trim();const email=String(req.body.email||"").trim().toLowerCase();const phone=String(req.body.phone||"").trim();const password=String(req.body.password||"");const specialty=String(req.body.specialty||"").trim();const description=String(req.body.description||"").trim();const start=String(req.body.start||"");const end=String(req.body.end||"");const serviceIds=Array.isArray(req.body.serviceIds)?req.body.serviceIds:[];const workDays=Array.isArray(req.body.workDays)?req.body.workDays.map(Number).filter(day=>day>=1&&day<=6):[];
  if(name.length<3||!emailPattern.test(email)||phone.length<8||password.length<8||specialty.length<3||!/^\d{2}:\d{2}$/.test(start)||!/^\d{2}:\d{2}$/.test(end)||start>=end||!workDays.length)return res.status(400).json({message:"Revise os dados, os dias e o horário de trabalho do profissional."});
  const hash=await bcrypt.hash(password,12);const initials=name.split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase();
  const rows=await sql`WITH created_professional AS (INSERT INTO professionals (id,name,specialty,description,initials,tone,service_ids,work_days,start_time,end_time) VALUES ('p-'||replace(gen_random_uuid()::text,'-',''),${name},${specialty},${description},${initials},'rose',${JSON.stringify(serviceIds)}::jsonb,${JSON.stringify(workDays)}::jsonb,${start}::time,${end}::time) RETURNING *), created_user AS (INSERT INTO users (name,email,phone,password_hash,role,professional_id) SELECT ${name},${email},${phone},${hash},'professional',id FROM created_professional RETURNING id) SELECT id,name,specialty,description,initials,tone,service_ids,active,work_days,to_char(start_time,'HH24:MI') AS start,to_char(end_time,'HH24:MI') AS end FROM created_professional`;
  res.status(201).json({professional:publicProfessional(rows[0])});
 }catch(error){if(error?.code==='23505')return res.status(409).json({message:"Já existe uma conta com este e-mail."});next(error)}
});

app.post("/api/blocks",auth,async(req,res,next)=>{
 try{
  if(req.user.role!=="admin")return res.status(403).json({message:"Somente o salão pode adicionar bloqueios."});
  const professionalId=req.body.professionalId?String(req.body.professionalId):null;const date=String(req.body.date||"");const reason=String(req.body.reason||"").trim();const wholeDay=Boolean(req.body.wholeDay);const startTime=wholeDay?null:String(req.body.startTime||"");const endTime=wholeDay?null:String(req.body.endTime||"");
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||reason.length<3||(!wholeDay&&(!/^\d{2}:\d{2}$/.test(startTime)||!/^\d{2}:\d{2}$/.test(endTime)||startTime>=endTime)))return res.status(400).json({message:"Informe uma data, um motivo e um período válido."});
  const rows=await sql`INSERT INTO schedule_blocks (professional_id,block_date,reason,whole_day,start_time,end_time) VALUES (${professionalId},${date}::date,${reason},${wholeDay},${startTime}::time,${endTime}::time) RETURNING id::text,professional_id,to_char(block_date,'YYYY-MM-DD') AS date,reason,whole_day,to_char(start_time,'HH24:MI') AS start_time,to_char(end_time,'HH24:MI') AS end_time`;
  res.status(201).json({block:publicBlock(rows[0])});
 }catch(error){next(error)}
});

app.delete("/api/blocks/:id",auth,async(req,res,next)=>{
 try{if(req.user.role!=="admin")return res.status(403).json({message:"Somente o salão pode remover bloqueios."});const rows=await sql`DELETE FROM schedule_blocks WHERE id=${req.params.id}::uuid RETURNING id`;if(!rows[0])return res.status(404).json({message:"Bloqueio não encontrado."});res.json({ok:true})}catch(error){next(error)}
});

app.get("/api/appointments/mine",auth,async(req,res,next)=>{
 try{
  if(req.user.role!=="client")return res.status(403).json({message:"Área exclusiva para clientes."});
  const rows=await sql`SELECT id::text,service_id AS "serviceId",professional_id AS "professionalId",to_char(appointment_date,'YYYY-MM-DD') AS date,to_char(start_time,'HH24:MI') AS time,status,notes FROM appointments WHERE client_id=${req.user.id} ORDER BY appointment_date,start_time`;
  res.json({appointments:rows});
 }catch(error){next(error)}
});

app.post("/api/appointments",auth,async(req,res,next)=>{
 try{
  if(req.user.role!=="client")return res.status(403).json({message:"Somente clientes podem realizar agendamentos."});
  const {serviceId,serviceName,professionalId,professionalName,date,time,duration,price}=req.body;
  if(!serviceId||!serviceName||!professionalId||!professionalName||!/^\d{4}-\d{2}-\d{2}$/.test(date||"")||!/^\d{2}:\d{2}$/.test(time||"")||!Number.isInteger(duration)||duration<15||!Number.isFinite(Number(price))||Number(price)<0)return res.status(400).json({message:"Dados do agendamento incompletos."});
  const blocked=await sql`SELECT id FROM schedule_blocks WHERE block_date=${date}::date AND (professional_id IS NULL OR professional_id=${professionalId}) AND (whole_day OR (${time}::time<end_time AND ${time}::time+(${duration}||' minutes')::interval>start_time)) LIMIT 1`;
  if(blocked[0])return res.status(409).json({message:"O profissional está indisponível neste período."});
  const conflict=await sql`SELECT id FROM appointments WHERE professional_id=${professionalId} AND appointment_date=${date}::date AND status NOT IN ('Cancelado','Não compareceu') AND ${time}::time < start_time + (duration_minutes || ' minutes')::interval AND ${time}::time + (${duration} || ' minutes')::interval > start_time LIMIT 1`;
  if(conflict[0])return res.status(409).json({message:"Este horário acabou de ser reservado. Escolha outro horário."});
  const rows=await sql`INSERT INTO appointments (client_id,service_id,service_name,professional_id,professional_name,appointment_date,start_time,duration_minutes,price_cents) VALUES (${req.user.id},${serviceId},${serviceName},${professionalId},${professionalName},${date}::date,${time}::time,${duration},${Math.round(Number(price)*100)}) RETURNING id::text,service_id AS "serviceId",professional_id AS "professionalId",to_char(appointment_date,'YYYY-MM-DD') AS date,to_char(start_time,'HH24:MI') AS time,status,notes`;
  res.status(201).json({appointment:rows[0]});
 }catch(error){next(error)}
});

app.patch("/api/appointments/:id/cancel",auth,async(req,res,next)=>{
 try{
  const rows=await sql`UPDATE appointments SET status='Cancelado',updated_at=NOW() WHERE id=${req.params.id}::uuid AND client_id=${req.user.id} AND status NOT IN ('Cancelado','Concluído') RETURNING id`;
  if(!rows[0])return res.status(404).json({message:"Agendamento não encontrado ou não pode mais ser cancelado."});
  res.json({ok:true});
 }catch(error){next(error)}
});

const here=path.dirname(fileURLToPath(import.meta.url));
if(process.env.NODE_ENV==="production"){
 const dist=path.join(here,"../dist");app.use(express.static(dist));app.use((_req,res)=>res.sendFile(path.join(dist,"index.html")));
}
app.use((error,_req,res,_next)=>{console.error(error);res.status(500).json({message:"Erro interno. Tente novamente em instantes."})});
app.listen(port,()=>console.log(`Backend Áurea disponível em http://localhost:${port}`));
