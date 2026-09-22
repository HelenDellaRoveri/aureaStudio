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

const app = express();
const port = Number(process.env.PORT || 3001);
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32)
  throw new Error("JWT_SECRET deve ter pelo menos 32 caracteres.");

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const schedulingToday = () => {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
};
const schedulingTime = () => {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part("hour")}:${part("minute")}`;
};
const validSchedulingDate = (date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return false;
  const current = schedulingToday();
  return date >= current && date <= `${current.slice(0, 4)}-12-31`;
};
const publicUser = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  role: row.role,
  professionalId: row.professional_id,
});
const publicProfessional = (row) => ({
  id: row.id,
  name: row.name,
  specialty: row.specialty,
  description: row.description,
  initials: row.initials,
  tone: row.tone,
  serviceIds: row.service_ids,
  active: row.active,
  workDays: row.work_days,
  start: row.start,
  end: row.end,
});
const publicService = (row) => ({
  id: row.id,
  name: row.name,
  category: row.category,
  description: row.description,
  duration: row.duration_minutes,
  price: Number(row.price_cents) / 100,
  professionalIds: row.professional_ids || [],
  active: row.active,
  icon: row.icon,
});
const publicBlock = (row) => ({
  id: row.id,
  professionalId: row.professional_id,
  date: row.date,
  reason: row.reason,
  wholeDay: row.whole_day,
  startTime: row.start_time,
  endTime: row.end_time,
});
const publicBusinessHour = (row) => ({
  day: row.day_of_week,
  active: row.active,
  start: row.start,
  end: row.end,
});
const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};
const issueSession = (res, user) =>
  res.cookie(
    "aurea_token",
    jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: "7d" }),
    cookieOptions,
  );
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  },
});

async function auth(req, res, next) {
  try {
    const token = req.cookies.aurea_token;
    if (!token)
      return res.status(401).json({ message: "Faça login para continuar." });
    const payload = jwt.verify(token, jwtSecret);
    const rows =
      await sql`SELECT id,name,email,phone,role,professional_id FROM users WHERE id=${payload.sub} LIMIT 1`;
    if (!rows[0]) return res.status(401).json({ message: "Sessão inválida." });
    req.user = rows[0];
    next();
  } catch {
    return res
      .status(401)
      .json({ message: "Sua sessão expirou. Entre novamente." });
  }
}

async function availabilityIssue({
  appointmentId = null,
  professionalId,
  date,
  time,
  duration,
}) {
  const hours =
    await sql`SELECT 1 FROM business_hours bh JOIN professionals p ON p.id=${professionalId} WHERE bh.day_of_week=EXTRACT(DOW FROM ${date}::date)::int AND bh.active=TRUE AND p.active=TRUE AND p.work_days @> jsonb_build_array(EXTRACT(DOW FROM ${date}::date)::int) AND ${time}::time>=GREATEST(bh.start_time,p.start_time) AND (${time}::time+(${duration}||' minutes')::interval)::time<=LEAST(bh.end_time,p.end_time) LIMIT 1`;
  if (!hours[0])
    return "O salão ou o profissional não trabalha neste dia e horário.";
  const blocked =
    await sql`SELECT id FROM schedule_blocks WHERE block_date=${date}::date AND (professional_id IS NULL OR professional_id=${professionalId}) AND (whole_day OR (${time}::time<end_time AND ${time}::time+(${duration}||' minutes')::interval>start_time)) LIMIT 1`;
  if (blocked[0]) return "O profissional está indisponível neste período.";
  const conflict =
    await sql`SELECT id FROM appointments WHERE professional_id=${professionalId} AND appointment_date=${date}::date AND status NOT IN ('Cancelado','Não compareceu') AND (${appointmentId}::uuid IS NULL OR id<>${appointmentId}::uuid) AND ${time}::time < start_time + (duration_minutes || ' minutes')::interval AND ${time}::time + (${duration} || ' minutes')::interval > start_time LIMIT 1`;
  if (conflict[0])
    return "Este horário acabou de ser reservado. Escolha outro horário.";
  return null;
}

app.get("/api/health", async (_req, res) => {
  await sql`SELECT 1`;
  res.json({ ok: true });
});

app.get("/api/services", async (_req, res, next) => {
  try {
    const rows =
      await sql`SELECT s.id,s.name,s.category,s.description,s.duration_minutes,s.price_cents,s.icon,s.active,COALESCE((SELECT jsonb_agg(p.id ORDER BY p.name) FROM professionals p WHERE p.service_ids @> jsonb_build_array(s.id)),'[]'::jsonb) AS professional_ids FROM services s ORDER BY s.category,s.name`;
    res.json({ services: rows.map(publicService) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/professionals", async (_req, res, next) => {
  try {
    const rows =
      await sql`SELECT id,name,specialty,description,initials,tone,service_ids,active,work_days,to_char(start_time,'HH24:MI') AS start,to_char(end_time,'HH24:MI') AS end FROM professionals ORDER BY created_at,name`;
    res.json({ professionals: rows.map(publicProfessional) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/blocks", async (_req, res, next) => {
  try {
    const rows =
      await sql`SELECT id::text,professional_id,to_char(block_date,'YYYY-MM-DD') AS date,reason,whole_day,to_char(start_time,'HH24:MI') AS start_time,to_char(end_time,'HH24:MI') AS end_time FROM schedule_blocks WHERE block_date>=CURRENT_DATE-INTERVAL '30 days' ORDER BY block_date,start_time`;
    res.json({ blocks: rows.map(publicBlock) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/business-hours", async (_req, res, next) => {
  try {
    const rows =
      await sql`SELECT day_of_week,active,to_char(start_time,'HH24:MI') AS start,to_char(end_time,'HH24:MI') AS end FROM business_hours ORDER BY day_of_week`;
    res.json({ businessHours: rows.map(publicBusinessHour) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/register", authLimiter, async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const phone = String(req.body.phone || "").trim();
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");
    if (
      name.length < 3 ||
      !emailPattern.test(email) ||
      phone.length < 8 ||
      password.length < 8
    )
      return res.status(400).json({
        message:
          "Preencha nome, telefone, e-mail válido e uma senha de pelo menos 8 caracteres.",
      });
    const existing =
      await sql`SELECT id FROM users WHERE email=${email} LIMIT 1`;
    if (existing[0])
      return res
        .status(409)
        .json({ message: "Este e-mail já está cadastrado." });
    const hash = await bcrypt.hash(password, 12);
    const rows =
      await sql`INSERT INTO users (name,email,phone,password_hash,role) VALUES (${name},${email},${phone},${hash},'client') RETURNING id,name,email,phone,role,professional_id`;
    issueSession(res, rows[0]);
    res.status(201).json({ user: publicUser(rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", authLimiter, async (req, res, next) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");
    const role = String(req.body.role || "");
    const rows =
      await sql`SELECT id,name,email,phone,password_hash,role,professional_id FROM users WHERE email=${email} LIMIT 1`;
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ message: "E-mail ou senha incorretos." });
    if (user.role !== role)
      return res
        .status(403)
        .json({ message: "Este cadastro pertence a outro tipo de acesso." });
    issueSession(res, user);
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", auth, (req, res) =>
  res.json({ user: publicUser(req.user) }),
);
app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie("aurea_token", { path: "/" });
  res.json({ ok: true });
});

app.post("/api/services", auth, async (req, res, next) => {
  try {
    if (req.user.role !== "admin")
      return res
        .status(403)
        .json({ message: "Somente o salão pode cadastrar serviços." });
    const name = String(req.body.name || "").trim();
    const category = String(req.body.category || "").trim();
    const description = String(req.body.description || "").trim();
    const duration = Number(req.body.duration);
    const price = Number(req.body.price);
    const icon = String(req.body.icon || "Sparkles").trim();
    if (
      name.length < 2 ||
      category.length < 2 ||
      description.length < 3 ||
      !Number.isInteger(duration) ||
      duration < 15 ||
      duration > 720 ||
      !Number.isFinite(price) ||
      price < 0
    )
      return res.status(400).json({
        message:
          "Revise o nome, a categoria, a descrição, a duração e o preço.",
      });
    const rows =
      await sql`INSERT INTO services (name,category,description,duration_minutes,price_cents,icon) VALUES (${name},${category},${description},${duration},${Math.round(price * 100)},${icon || "Sparkles"}) RETURNING id,name,category,description,duration_minutes,price_cents,icon,active,'[]'::jsonb AS professional_ids`;
    res.status(201).json({ service: publicService(rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/services/:id", auth, async (req, res, next) => {
  try {
    if (req.user.role !== "admin")
      return res
        .status(403)
        .json({ message: "Somente o salão pode editar serviços." });
    const id = String(req.params.id || "");
    const name = String(req.body.name || "").trim();
    const category = String(req.body.category || "").trim();
    const description = String(req.body.description || "").trim();
    const duration = Number(req.body.duration);
    const price = Number(req.body.price);
    const icon = String(req.body.icon || "Sparkles").trim();
    const active = Boolean(req.body.active);
    if (
      !id ||
      name.length < 2 ||
      category.length < 2 ||
      description.length < 3 ||
      !Number.isInteger(duration) ||
      duration < 15 ||
      duration > 720 ||
      !Number.isFinite(price) ||
      price < 0
    )
      return res.status(400).json({
        message:
          "Revise o nome, a categoria, a descrição, a duração e o preço.",
      });
    const rows =
      await sql`WITH updated AS (UPDATE services SET name=${name},category=${category},description=${description},duration_minutes=${duration},price_cents=${Math.round(price * 100)},icon=${icon || "Sparkles"},active=${active},updated_at=NOW() WHERE id=${id} RETURNING *) SELECT updated.id,updated.name,updated.category,updated.description,updated.duration_minutes,updated.price_cents,updated.icon,updated.active,COALESCE((SELECT jsonb_agg(p.id ORDER BY p.name) FROM professionals p WHERE p.service_ids @> jsonb_build_array(updated.id)),'[]'::jsonb) AS professional_ids FROM updated`;
    if (!rows[0])
      return res.status(404).json({ message: "Serviço não encontrado." });
    res.json({ service: publicService(rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.put("/api/business-hours", auth, async (req, res, next) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({
        message: "Somente o salão pode alterar os dias de funcionamento.",
      });
    const businessHours = Array.isArray(req.body.businessHours)
      ? req.body.businessHours
      : [];
    const valid =
      businessHours.length === 6 &&
      new Set(businessHours.map((item) => Number(item.day))).size === 6 &&
      businessHours.every(
        (item) =>
          Number(item.day) >= 1 &&
          Number(item.day) <= 6 &&
          /^\d{2}:\d{2}$/.test(String(item.start || "")) &&
          /^\d{2}:\d{2}$/.test(String(item.end || "")) &&
          item.start < item.end,
      );
    if (!valid)
      return res
        .status(400)
        .json({ message: "Revise os dias e horários de funcionamento." });
    const rows =
      await sql`WITH removed AS (DELETE FROM business_hours), inserted AS (INSERT INTO business_hours (day_of_week,active,start_time,end_time) SELECT day,active,start::time,"end"::time FROM jsonb_to_recordset(${JSON.stringify(businessHours)}::jsonb) AS item(day integer,active boolean,start text,"end" text) RETURNING *) SELECT day_of_week,active,to_char(start_time,'HH24:MI') AS start,to_char(end_time,'HH24:MI') AS end FROM inserted ORDER BY day_of_week`;
    res.json({ businessHours: rows.map(publicBusinessHour) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/professionals", auth, async (req, res, next) => {
  try {
    if (req.user.role !== "admin")
      return res
        .status(403)
        .json({ message: "Somente o salão pode cadastrar profissionais." });
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const phone = String(req.body.phone || "").trim();
    const password = String(req.body.password || "");
    const specialty = String(req.body.specialty || "").trim();
    const description = String(req.body.description || "").trim();
    const start = String(req.body.start || "");
    const end = String(req.body.end || "");
    const serviceIds = Array.isArray(req.body.serviceIds)
      ? req.body.serviceIds
      : [];
    const workDays = Array.isArray(req.body.workDays)
      ? req.body.workDays.map(Number).filter((day) => day >= 1 && day <= 6)
      : [];
    if (
      name.length < 3 ||
      !emailPattern.test(email) ||
      phone.length < 8 ||
      password.length < 8 ||
      specialty.length < 3 ||
      !/^\d{2}:\d{2}$/.test(start) ||
      !/^\d{2}:\d{2}$/.test(end) ||
      start >= end ||
      !workDays.length
    )
      return res.status(400).json({
        message:
          "Revise os dados, os dias e o horário de trabalho do profissional.",
      });
    const hash = await bcrypt.hash(password, 12);
    const initials = name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
    const rows =
      await sql`WITH created_professional AS (INSERT INTO professionals (id,name,specialty,description,initials,tone,service_ids,work_days,start_time,end_time) VALUES ('p-'||replace(gen_random_uuid()::text,'-',''),${name},${specialty},${description},${initials},'rose',${JSON.stringify(serviceIds)}::jsonb,${JSON.stringify(workDays)}::jsonb,${start}::time,${end}::time) RETURNING *), created_user AS (INSERT INTO users (name,email,phone,password_hash,role,professional_id) SELECT ${name},${email},${phone},${hash},'professional',id FROM created_professional RETURNING id) SELECT id,name,specialty,description,initials,tone,service_ids,active,work_days,to_char(start_time,'HH24:MI') AS start,to_char(end_time,'HH24:MI') AS end FROM created_professional`;
    res.status(201).json({ professional: publicProfessional(rows[0]) });
  } catch (error) {
    if (error?.code === "23505")
      return res
        .status(409)
        .json({ message: "Já existe uma conta com este e-mail." });
    next(error);
  }
});

app.patch("/api/professionals/:id", auth, async (req, res, next) => {
  try {
    if (req.user.role !== "admin")
      return res
        .status(403)
        .json({ message: "Somente o salão pode editar profissionais." });
    const id = String(req.params.id || "");
    const name = String(req.body.name || "").trim();
    const specialty = String(req.body.specialty || "").trim();
    const description = String(req.body.description || "").trim();
    const start = String(req.body.start || "");
    const end = String(req.body.end || "");
    const active = Boolean(req.body.active);
    const serviceIds = Array.isArray(req.body.serviceIds)
      ? req.body.serviceIds
      : [];
    const workDays = Array.isArray(req.body.workDays)
      ? req.body.workDays.map(Number).filter((day) => day >= 1 && day <= 6)
      : [];
    if (
      !id ||
      name.length < 3 ||
      specialty.length < 3 ||
      !/^\d{2}:\d{2}$/.test(start) ||
      !/^\d{2}:\d{2}$/.test(end) ||
      start >= end ||
      !workDays.length
    )
      return res.status(400).json({
        message:
          "Revise os dados, os dias e o horário de trabalho do profissional.",
      });
    const initials = name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
    const rows =
      await sql`WITH updated_professional AS (UPDATE professionals SET name=${name},specialty=${specialty},description=${description},initials=${initials},service_ids=${JSON.stringify(serviceIds)}::jsonb,work_days=${JSON.stringify(workDays)}::jsonb,start_time=${start}::time,end_time=${end}::time,active=${active},updated_at=NOW() WHERE id=${id} RETURNING *), updated_user AS (UPDATE users SET name=${name},updated_at=NOW() WHERE professional_id=${id} RETURNING id) SELECT id,name,specialty,description,initials,tone,service_ids,active,work_days,to_char(start_time,'HH24:MI') AS start,to_char(end_time,'HH24:MI') AS end FROM updated_professional`;
    if (!rows[0])
      return res.status(404).json({ message: "Profissional não encontrado." });
    res.json({ professional: publicProfessional(rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/blocks", auth, async (req, res, next) => {
  try {
    if (req.user.role !== "admin")
      return res
        .status(403)
        .json({ message: "Somente o salão pode adicionar bloqueios." });
    const professionalId = req.body.professionalId
      ? String(req.body.professionalId)
      : null;
    const date = String(req.body.date || "");
    const reason = String(req.body.reason || "").trim();
    const wholeDay = Boolean(req.body.wholeDay);
    const startTime = wholeDay ? null : String(req.body.startTime || "");
    const endTime = wholeDay ? null : String(req.body.endTime || "");
    if (
      !validSchedulingDate(date) ||
      reason.length < 3 ||
      (!wholeDay &&
        (!/^\d{2}:\d{2}$/.test(startTime) ||
          !/^\d{2}:\d{2}$/.test(endTime) ||
          startTime >= endTime))
    )
      return res.status(400).json({
        message:
          "A data deve estar entre hoje e 31 de dezembro deste ano, com um período válido.",
      });
    const rows =
      await sql`INSERT INTO schedule_blocks (professional_id,block_date,reason,whole_day,start_time,end_time) VALUES (${professionalId},${date}::date,${reason},${wholeDay},${startTime}::time,${endTime}::time) RETURNING id::text,professional_id,to_char(block_date,'YYYY-MM-DD') AS date,reason,whole_day,to_char(start_time,'HH24:MI') AS start_time,to_char(end_time,'HH24:MI') AS end_time`;
    res.status(201).json({ block: publicBlock(rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/blocks/:id", auth, async (req, res, next) => {
  try {
    if (req.user.role !== "admin")
      return res
        .status(403)
        .json({ message: "Somente o salão pode remover bloqueios." });
    const rows =
      await sql`DELETE FROM schedule_blocks WHERE id=${req.params.id}::uuid RETURNING id`;
    if (!rows[0])
      return res.status(404).json({ message: "Bloqueio não encontrado." });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/appointments", auth, async (req, res, next) => {
  try {
    if (!["admin", "professional"].includes(req.user.role))
      return res.status(403).json({ message: "Área exclusiva da equipe." });
    const rows =
      req.user.role === "admin"
        ? await sql`SELECT a.id::text,u.name AS client,u.phone,a.service_id AS "serviceId",a.service_name AS "serviceName",a.professional_id AS "professionalId",a.professional_name AS "professionalName",to_char(a.appointment_date,'YYYY-MM-DD') AS date,to_char(a.start_time,'HH24:MI') AS time,a.status,a.notes,a.duration_minutes AS duration,a.price_cents::float/100 AS price FROM appointments a JOIN users u ON u.id=a.client_id ORDER BY a.appointment_date,a.start_time`
        : await sql`SELECT a.id::text,u.name AS client,u.phone,a.service_id AS "serviceId",a.service_name AS "serviceName",a.professional_id AS "professionalId",a.professional_name AS "professionalName",to_char(a.appointment_date,'YYYY-MM-DD') AS date,to_char(a.start_time,'HH24:MI') AS time,a.status,a.notes,a.duration_minutes AS duration,a.price_cents::float/100 AS price FROM appointments a JOIN users u ON u.id=a.client_id WHERE a.professional_id=${req.user.professional_id} ORDER BY a.appointment_date,a.start_time`;
    res.json({ appointments: rows });
  } catch (error) {
    next(error);
  }
});

app.get("/api/appointments/mine", auth, async (req, res, next) => {
  try {
    if (req.user.role !== "client")
      return res.status(403).json({ message: "Área exclusiva para clientes." });
    const rows =
      await sql`SELECT id::text,service_id AS "serviceId",service_name AS "serviceName",professional_id AS "professionalId",professional_name AS "professionalName",to_char(appointment_date,'YYYY-MM-DD') AS date,to_char(start_time,'HH24:MI') AS time,status,notes,duration_minutes AS duration,price_cents::float/100 AS price FROM appointments WHERE client_id=${req.user.id} ORDER BY appointment_date,start_time`;
    res.json({ appointments: rows });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/appointments/:id/status", auth, async (req, res, next) => {
  try {
    if (!["admin", "professional"].includes(req.user.role))
      return res.status(403).json({ message: "Área exclusiva da equipe." });
    const allowedStatuses = [
      "Agendado",
      "Confirmado",
      "Concluído",
      "Cancelado",
      "Não compareceu",
    ];
    const status = String(req.body.status || "");
    if (!allowedStatuses.includes(status))
      return res.status(400).json({ message: "Status inválido." });
    const rows =
      req.user.role === "admin"
        ? await sql`UPDATE appointments SET status=${status},updated_at=NOW() WHERE id=${req.params.id}::uuid RETURNING id::text,status`
        : await sql`UPDATE appointments SET status=${status},updated_at=NOW() WHERE id=${req.params.id}::uuid AND professional_id=${req.user.professional_id} RETURNING id::text,status`;
    if (!rows[0])
      return res.status(404).json({ message: "Agendamento não encontrado." });
    res.json({ appointment: rows[0] });
  } catch (error) {
    next(error);
  }
});

app.post("/api/appointments", auth, async (req, res, next) => {
  try {
    if (req.user.role !== "client")
      return res
        .status(403)
        .json({ message: "Somente clientes podem realizar agendamentos." });
    const { serviceId, professionalId, date, time } = req.body;
    if (
      !serviceId ||
      !professionalId ||
      !validSchedulingDate(date) ||
      !/^\d{2}:\d{2}$/.test(time || "")
    )
      return res.status(400).json({
        message:
          "A data do agendamento deve estar entre hoje e 31 de dezembro deste ano.",
      });
    if (date === schedulingToday() && time <= schedulingTime())
      return res.status(400).json({
        message: "Escolha um horário futuro para agendamentos de hoje.",
      });
    const catalog =
      await sql`SELECT s.name AS service_name,s.duration_minutes,s.price_cents,p.name AS professional_name FROM services s JOIN professionals p ON p.id=${professionalId} WHERE s.id=${serviceId} AND s.active=TRUE AND p.active=TRUE AND p.service_ids @> jsonb_build_array(s.id) LIMIT 1`;
    if (!catalog[0])
      return res.status(400).json({
        message: "Serviço ou profissional indisponível para agendamento.",
      });
    const duration = catalog[0].duration_minutes;
    const issue = await availabilityIssue({
      professionalId,
      date,
      time,
      duration,
    });
    if (issue) return res.status(409).json({ message: issue });
    const rows =
      await sql`INSERT INTO appointments (client_id,service_id,service_name,professional_id,professional_name,appointment_date,start_time,duration_minutes,price_cents) VALUES (${req.user.id},${serviceId},${catalog[0].service_name},${professionalId},${catalog[0].professional_name},${date}::date,${time}::time,${duration},${catalog[0].price_cents}) RETURNING id::text,service_id AS "serviceId",service_name AS "serviceName",professional_id AS "professionalId",professional_name AS "professionalName",to_char(appointment_date,'YYYY-MM-DD') AS date,to_char(start_time,'HH24:MI') AS time,status,notes,duration_minutes AS duration,price_cents::float/100 AS price`;
    res.status(201).json({ appointment: rows[0] });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/appointments/:id/reschedule", auth, async (req, res, next) => {
  try {
    if (req.user.role !== "client")
      return res.status(403).json({ message: "Área exclusiva para clientes." });
    const { serviceId, professionalId, date, time } = req.body;
    if (
      !serviceId ||
      !professionalId ||
      !validSchedulingDate(date) ||
      !/^\d{2}:\d{2}$/.test(time || "")
    )
      return res
        .status(400)
        .json({ message: "Revise os dados do reagendamento." });
    if (date === schedulingToday() && time <= schedulingTime())
      return res.status(400).json({
        message: "Escolha um horário futuro para reagendamentos de hoje.",
      });
    const owned =
      await sql`SELECT id FROM appointments WHERE id=${req.params.id}::uuid AND client_id=${req.user.id} AND status NOT IN ('Cancelado','Concluído') LIMIT 1`;
    if (!owned[0])
      return res.status(404).json({
        message: "Agendamento não encontrado ou não pode mais ser reagendado.",
      });
    const catalog =
      await sql`SELECT s.name AS service_name,s.duration_minutes,s.price_cents,p.name AS professional_name FROM services s JOIN professionals p ON p.id=${professionalId} WHERE s.id=${serviceId} AND s.active=TRUE AND p.active=TRUE AND p.service_ids @> jsonb_build_array(s.id) LIMIT 1`;
    if (!catalog[0])
      return res.status(400).json({
        message: "Serviço ou profissional indisponível para reagendamento.",
      });
    const duration = catalog[0].duration_minutes;
    const issue = await availabilityIssue({
      appointmentId: req.params.id,
      professionalId,
      date,
      time,
      duration,
    });
    if (issue) return res.status(409).json({ message: issue });
    const rows =
      await sql`UPDATE appointments SET service_id=${serviceId},service_name=${catalog[0].service_name},professional_id=${professionalId},professional_name=${catalog[0].professional_name},appointment_date=${date}::date,start_time=${time}::time,duration_minutes=${duration},price_cents=${catalog[0].price_cents},status='Agendado',updated_at=NOW() WHERE id=${req.params.id}::uuid AND client_id=${req.user.id} RETURNING id::text,service_id AS "serviceId",service_name AS "serviceName",professional_id AS "professionalId",professional_name AS "professionalName",to_char(appointment_date,'YYYY-MM-DD') AS date,to_char(start_time,'HH24:MI') AS time,status,notes,duration_minutes AS duration,price_cents::float/100 AS price`;
    res.json({ appointment: rows[0] });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/appointments/:id/cancel", auth, async (req, res, next) => {
  try {
    const rows =
      await sql`UPDATE appointments SET status='Cancelado',updated_at=NOW() WHERE id=${req.params.id}::uuid AND client_id=${req.user.id} AND status NOT IN ('Cancelado','Concluído') RETURNING id`;
    if (!rows[0])
      return res.status(404).json({
        message: "Agendamento não encontrado ou não pode mais ser cancelado.",
      });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

const here = path.dirname(fileURLToPath(import.meta.url));
if (process.env.NODE_ENV === "production") {
  const dist = path.join(here, "../dist");
  app.use(express.static(dist));
  app.use((_req, res) => res.sendFile(path.join(dist, "index.html")));
}
app.use((error, _req, res, _next) => {
  console.error(error);
  res
    .status(500)
    .json({ message: "Erro interno. Tente novamente em instantes." });
});
app.listen(port, () =>
  console.log(`Backend Áurea disponível em http://localhost:${port}`),
);
